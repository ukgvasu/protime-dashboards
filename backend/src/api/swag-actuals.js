import express from 'express';
import { fetchIssues } from '../services/jira-service.js';

const router = express.Router();

function buildPeriods(q3Start = '2026-04-01', q3End = '2026-06-30') {
  const periods = [];
  const end = new Date(`${q3End}T12:00:00`);
  let d = new Date(`${q3Start}T12:00:00`);
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

// Strip common Q3 title prefixes so summaries are concise
function stripPrefix(summary, prefixes) {
  for (const p of prefixes) {
    if (summary.startsWith(p)) return summary.slice(p.length);
  }
  return summary;
}

async function buildQ3Data(beLabel, titlePrefixes, q3Start = '2026-04-01', q3End = '2026-06-30', psEpicSearch = null) {
  // 1. Fetch Business Epics by label
  const beIssues = await fetchIssues(
    `project = EP AND issuetype = "Business Epic" AND labels = "${beLabel}"`,
    50,
    ['summary', 'customfield_18302']
  );

  const businessEpics = beIssues.map(issue => ({
    key: issue.key,
    summary: stripPrefix(issue.fields?.summary || issue.key, titlePrefixes),
    swag: parseFloat(issue.fields?.customfield_18302) || 0,
  }));

  const beKeys = businessEpics.map(b => b.key);

  if (beKeys.length === 0) {
    return {
      periods: [],
      periodDates: [],
      totalSwag: 0,
      asOf: new Date().toISOString().split('T')[0],
      timeElapsed: 0,
      epics: [],
      stories: [],
      storiesAnalyzed: 0,
      storiesWithPoints: 0,
    };
  }

  // 2. Fetch child PS epics — customfield_15506 is not JQL-indexable so we search by
  //    summary pattern and then filter by the field value in code.
  let psEpics = [];
  if (psEpicSearch) {
    psEpics = await fetchIssues(
      `project = PS AND issuetype = Epic AND summary ~ "${psEpicSearch}"`,
      500,
      ['summary', 'customfield_15506']
    );
  }

  const psEpicToBe = {};
  const psEpicKeys = [];
  psEpics.forEach(i => {
    const rawField = i.fields?.customfield_15506;
    const beKey = typeof rawField === 'string' ? rawField : (rawField?.value || null);
    if (beKey && beKeys.includes(beKey)) {
      psEpicToBe[i.key] = beKey;
      psEpicKeys.push(i.key);
    }
  });

  // 3. Fetch resolved stories under PS epics since q3Start
  let stories = [];
  if (psEpicKeys.length > 0) {
    stories = await fetchIssues(
      `project = PS AND issuetype not in (Epic, "Business Epic") AND cf[12507] in (${psEpicKeys.join(', ')}) AND resolutiondate >= "${q3Start}" ORDER BY resolutiondate ASC`,
      2000,
      ['summary', 'status', 'resolutiondate', 'timetracking', 'customfield_12507', 'assignee']
    );
  }

  // 4. Build 2-week periods
  const periods = buildPeriods(q3Start, q3End);

  // 5. Bucket story points into periods
  const beActuals = {};
  beKeys.forEach(k => { beActuals[k] = periods.map(() => 0); });

  const psEpicActuals = {};
  psEpicKeys.forEach(k => { psEpicActuals[k] = periods.map(() => 0); });

  const storyDetail = [];
  stories.forEach(story => {
    const rawEpicLink = story.fields?.customfield_12507;
    const epicLink = typeof rawEpicLink === 'string' ? rawEpicLink : (rawEpicLink?.value || null);
    const beKey = psEpicToBe[epicLink];
    const logged = (story.fields?.timetracking?.timeSpentSeconds || 0) / 3600;
    const resDate = story.fields?.resolutiondate?.split('T')[0];

    storyDetail.push({
      key: story.key,
      summary: story.fields?.summary || '',
      beKey: beKey || null,
      epicLink: epicLink || null,
      logged,
      resolutionDate: resDate || null,
      assignee: story.fields?.assignee?.displayName || 'Unassigned',
      status: story.fields?.status?.name || '',
    });

    if (!resDate) return;
    const periodIdx = periods.findIndex(p => resDate >= p.start && resDate <= p.end);
    if (periodIdx < 0) return;

    if (beKey && beActuals[beKey]) beActuals[beKey][periodIdx] += logged;
    if (epicLink && psEpicActuals[epicLink]) psEpicActuals[epicLink][periodIdx] += logged;
  });

  const totalSwag = businessEpics.reduce((s, be) => s + be.swag, 0);
  const today = new Date().toISOString().split('T')[0];
  const elapsed = Math.max(0, Math.min(1,
    (new Date(today) - new Date(q3Start)) / (new Date(q3End) - new Date(q3Start))
  ));

  return {
    periods: periods.map(p => p.label),
    periodDates: periods.map(p => ({ start: p.start, end: p.end })),
    totalSwag,
    asOf: today,
    timeElapsed: Math.round(elapsed * 100),
    epics: businessEpics.map(be => ({
      key: be.key,
      summary: be.summary,
      swag: be.swag,
      actuals: beActuals[be.key] || periods.map(() => 0),
      totalActuals: (beActuals[be.key] || []).reduce((s, v) => s + v, 0),
      psEpics: psEpics
        .filter(p => {
          const raw = p.fields?.customfield_15506;
          const val = typeof raw === 'string' ? raw : (raw?.value || null);
          return val === be.key;
        })
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
    storiesWithTime: stories.filter(s => (s.fields?.timetracking?.timeSpentSeconds || 0) > 0).length,
  };
}

// GET /api/swag-actuals/uta-q3
router.get('/uta-q3', async (req, res) => {
  try {
    const data = await buildQ3Data('UTA_2026_Q3', ['UTA FY26 Q3 - '], '2026-03-25', '2026-06-23', 'UTA 26.3');
    res.json(data);
  } catch (err) {
    console.error('[swag-actuals/uta-q3] error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/swag-actuals/utm-q3
router.get('/utm-q3', async (req, res) => {
  try {
    const data = await buildQ3Data('UTM_2026_Q3', ['UTM FY26 Q3 - '], '2026-03-25', '2026-06-23', 'UTM 26.3');
    res.json(data);
  } catch (err) {
    console.error('[swag-actuals/utm-q3] error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/swag-actuals/wfc-q3
router.get('/wfc-q3', async (req, res) => {
  try {
    const data = await buildQ3Data('WFMC_2026_Q3', ['WFM Classic FY26 Q3 - ', 'WFMC FY26 Q3 - '], '2026-03-25', '2026-06-23', 'WFMC 26.3');
    res.json(data);
  } catch (err) {
    console.error('[swag-actuals/wfc-q3] error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

export default router;
