import express from 'express';
import { fetchIssues } from '../services/jira-service.js';

const router = express.Router();

const UTA_Q3_BE_KEYS = [
  'EP-11196', 'EP-11657', 'EP-11659', 'EP-11660',
  'EP-11661', 'EP-11662', 'EP-11663', 'EP-11664'
];

function buildPeriods() {
  const periods = [];
  // Use noon local time to avoid UTC-midnight timezone shifts
  const end = new Date('2026-06-30T12:00:00');
  let d = new Date('2026-04-01T12:00:00');
  const fmt = date => `${date.toLocaleString('en-US', { month: 'short' })} ${date.getDate()}`;

  while (d <= end) {
    const pStart = new Date(d);
    const pEnd = new Date(d);
    pEnd.setDate(pEnd.getDate() + 13);
    if (pEnd > end) pEnd.setTime(end.getTime());
    periods.push({
      label: `${fmt(pStart)}–${fmt(pEnd)}`,
      start: pStart.toISOString().split('T')[0],
      end: pEnd.toISOString().split('T')[0],
    });
    d.setDate(d.getDate() + 14);
  }
  return periods;
}

// GET /api/swag-actuals/uta-q3
router.get('/uta-q3', async (req, res) => {
  try {
    // 1. Fetch UTA Q3 business epics with SWAG field
    const beIssues = await fetchIssues(
      `key in (${UTA_Q3_BE_KEYS.join(',')})`,
      20,
      ['summary', 'customfield_18302']
    );

    const businessEpics = UTA_Q3_BE_KEYS.map(key => {
      const issue = beIssues.find(i => i.key === key);
      return {
        key,
        summary: (issue?.fields?.summary || key).replace('UTA FY26 Q3 - ', ''),
        swag: parseFloat(issue?.fields?.customfield_18302) || 0,
      };
    });

    // 2. Fetch child PS epics for all UTA Q3 BEs
    const psEpics = await fetchIssues(
      `"issueFunction" in linkedIssuesOf("key in (${UTA_Q3_BE_KEYS.join(',')})", "is parent of")`,
      200,
      ['summary', 'customfield_15506']
    );

    const psEpicToBe = {};
    const psEpicKeys = [];
    psEpics.forEach(i => {
      const beKey = i.fields?.customfield_15506;
      if (beKey) {
        psEpicToBe[i.key] = beKey;
        psEpicKeys.push(i.key);
      }
    });

    // 3. Fetch resolved stories under those PS epics since Apr 1
    let stories = [];
    if (psEpicKeys.length > 0) {
      stories = await fetchIssues(
        `project = PS AND issuetype in (Story, Task, "Sub-task") AND "Epic Link" in (${psEpicKeys.join(',')}) AND resolutiondate >= "2026-04-01" ORDER BY resolutiondate ASC`,
        2000,
        ['summary', 'status', 'resolutiondate', 'customfield_12503', 'customfield_12507', 'assignee']
      );
    }

    // 4. Build 2-week periods
    const periods = buildPeriods();

    // 5. Bucket story points into periods per BE and per PS epic
    const beActuals = {};
    UTA_Q3_BE_KEYS.forEach(k => { beActuals[k] = periods.map(() => 0); });

    const psEpicActuals = {};
    psEpicKeys.forEach(k => { psEpicActuals[k] = periods.map(() => 0); });

    const storyDetail = [];
    stories.forEach(story => {
      const epicLink = story.fields?.customfield_12507;
      const beKey = psEpicToBe[epicLink];
      const sp = parseFloat(story.fields?.customfield_12503) || 0;
      const resDate = story.fields?.resolutiondate?.split('T')[0];

      storyDetail.push({
        key: story.key,
        summary: story.fields?.summary || '',
        beKey: beKey || null,
        epicLink: epicLink || null,
        sp,
        resolutionDate: resDate || null,
        assignee: story.fields?.assignee?.displayName || 'Unassigned',
        status: story.fields?.status?.name || '',
      });

      if (!resDate) return;
      const periodIdx = periods.findIndex(p => resDate >= p.start && resDate <= p.end);
      if (periodIdx < 0) return;

      if (beKey && beActuals[beKey]) beActuals[beKey][periodIdx] += sp;
      if (epicLink && psEpicActuals[epicLink]) psEpicActuals[epicLink][periodIdx] += sp;
    });

    const totalSwag = businessEpics.reduce((s, be) => s + be.swag, 0);
    const today = new Date().toISOString().split('T')[0];
    const q3Start = '2026-04-01';
    const q3End = '2026-06-30';
    const elapsed = Math.max(0, Math.min(1,
      (new Date(today) - new Date(q3Start)) / (new Date(q3End) - new Date(q3Start))
    ));

    res.json({
      periods: periods.map(p => p.label),
      periodDates: periods.map(p => ({ start: p.start, end: p.end })),
      totalSwag,
      asOf: today,
      timeElapsed: Math.round(elapsed * 100),
      epics: businessEpics.map(be => ({
        key: be.key,
        summary: be.summary,
        swag: be.swag,
        actuals: beActuals[be.key],
        totalActuals: beActuals[be.key].reduce((s, v) => s + v, 0),
        psEpics: psEpics
          .filter(p => p.fields?.customfield_15506 === be.key)
          .map(p => ({
            key: p.key,
            summary: p.fields?.summary || p.key,
            actuals: psEpicActuals[p.key] || periods.map(() => 0),
            totalActuals: (psEpicActuals[p.key] || []).reduce((s, v) => s + v, 0),
          }))
          .sort((a, b) => b.totalActuals - a.totalActuals),
      })),
      stories: storyDetail,
      storiesAnalyzed: stories.length,
      storiesWithPoints: stories.filter(s => (s.fields?.customfield_12503 || 0) > 0).length,
    });
  } catch (err) {
    console.error('[swag-actuals] error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

export default router;
