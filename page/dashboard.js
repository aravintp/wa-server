// Global
let user;

// Variables
const baseUrl = window.location.origin; 
const agentSelect = document.getElementById('agent-filter');
const periodSelect = document.getElementById('period-filter');
const gperiodSelect = document.getElementById('gperiod-filter');
const stats_totalcall = document.getElementById('stats-totalcalls');
const crmSelect = document.getElementById('crm-filter');
const refreshBtn = document.getElementById('refresh-dashboard');

// calendar
const fp = flatpickr("#calendar", {
  dateFormat: "Y-m-d",
  onChange:  (selectedDates, dateStr) => customdate(dateStr)
});


// calendar listner
periodSelect.addEventListener("change", (e) => {
  if (e.target.value === "custom") {
    fp.open(); // open floating calendar
  }
});


// Listener event
agentSelect.addEventListener('click', applyFilters);
periodSelect.addEventListener('click', applyFilters);
gperiodSelect.addEventListener('click', applyFilters);
crmSelect.addEventListener('click', crmselect);
refreshBtn.addEventListener('click', refreshDash);


// Fetch dash data
user = await fetchBackendData(`${baseUrl}/api/dash/datafile`)


// Add user agent dynamically in dropdown
Object.keys(user).map(key => {
    addAgent(key,key);
})


/* ══════════════════════════════════════════════════════════════
   DASHBOARD — Options
══════════════════════════════════════════════════════════════ */

function addAgent(name,value){
    agentSelect.options[agentSelect.options.length] = new Option(name, value);
}

function addCrm(name,value){
    crmSelect.options[crmSelect.options.length] = new Option(name, value);
}



async function refreshDash(name,value){
  refreshBtn.classList.add('loading');
  user = await fetchStats(`${baseUrl}/api/dash/refresh-dash`)
  applyFilters();
  refreshBtn.classList.remove('loading');
}
/* ══════════════════════════════════════════════════════════════
   DASHBOARD — STATS
══════════════════════════════════════════════════════════════ */


async function customdate(date) {
  
  // parameter passed from outside
  const end = new Date(date);
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  end.setHours(23, 59, 59, 999);

  const agent  = document.getElementById('agent-filter').value;
  user = await fetchStats(`${baseUrl}/api/dash/custom`,agent,start,end)
  console.log(user)
  applyFilters();
}

function crmselect(date){

  const agent  = document.getElementById('agent-filter').value;
  const period = document.getElementById('period-filter').value.toLowerCase();
  const crmSelect = document.getElementById('crm-filter');
  const name   = crmSelect.value; // selected CRM / sheet

  // Get the array for the selected CRM
  const donut = user?.[agent]?.dashboard?.[period]?.pchart?.[name];

  if (!donut) {
    console.warn(`No data found for ${name}`);
    return;
  }

  drawDonut(donut);
}

export function applyFilters() {
  
  const agent  = document.getElementById('agent-filter').value;
  const period = (document.getElementById('period-filter').value).toLowerCase();
  const gperiod = (document.getElementById('gperiod-filter').value).toLowerCase();
  const card = user[agent].dashboard[period].card
  const graph = user[agent].dashboard[period].graph[gperiod]
  const donut = user[agent].dashboard[period].pchart
  const appt = user[agent].dashboard[period].apt


  if (period=== "custom") {
    fp.open(); // open floating calendar
  }

  crmSelect.options.length = 0;
  Object.keys(donut).map(key => {
    addCrm(key,key);
  })


  updateCard(card)
  updateChartSubtitle(agent,period,gperiod)
  drawLineChart(graph, period,gperiod ) 
  drawDonut(donut.all_crm)
  renderTable(agent,appt);
}


function updateCard(card) {
  // const d = (CALL_DATA[agent] || CALL_DATA.all)[period];
  // const conv       = d.picked > 0 ? ((d.appointments / d.picked) * 100).toFixed(1) : '0.0';
   //const answerRate = card[0] > 0 ? ((card[3] / card[0]) * 100).toFixed(1) : '0.0';


  document.getElementById('stat-total').textContent       = card[0]
  document.getElementById('stat-clockin').textContent     = card[1];
  document.getElementById('stat-callinghrs').textContent  = card[2];
  document.getElementById('stat-picked').textContent      = card[3];
  document.getElementById('stat-appts').textContent       = card[4];
  document.getElementById('stat-conv').textContent        = card[5];
  document.getElementById('stat-outreach').textContent    = card[6];
  document.getElementById('stat-answer-rate').textContent = card[7];

}

function updateChartSubtitle(agent, period) {
  const agentLabel  = agent === 'all' ? 'All agents' : agent;
  const periodLabel = period === 'today' ? 'today' : period === 'week' ? 'this week' : 'this month';
  document.getElementById('chart-subtitle').textContent = `${agentLabel} — ${periodLabel}`;
}


/* ══════════════════════════════════════════════════════════════
   DASHBOARD — LINE / AREA CHART (Canvas)
══════════════════════════════════════════════════════════════ */

function drawLineChart(data, period, gperiod) {

  const period_map = {
      "byhour": ["08:00", "09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00", "17:00", "18:00", "19:00"],
      "byday":  ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
      "byweek": ["W1", "W2", "W3", "W4"],

  } 

  const canvas = document.getElementById('line-canvas');
  const W = canvas.parentElement.clientWidth || 500;
  const H = 200;
  canvas.width  = W;
  canvas.height = H;

  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, W, H);

  const values = data.map(d => d);
  const labels = period_map[gperiod].map(d => d);
  const maxVal = Math.max(...values, 1);
  const padL=8, padR=16, padT=12, padB=20;
  const plotW = W - padL - padR;
  const plotH = H - padT - padB;
  const n = values.length;

  // Grid lines
  ctx.strokeStyle = 'hsla(215,14%,22%,0.8)';
  ctx.lineWidth = 1;
  for (let i = 0; i <= 4; i++) {
    const y = padT + (plotH / 4) * i;
    ctx.beginPath(); ctx.moveTo(padL, y); ctx.lineTo(padL + plotW, y); ctx.stroke();
  }

  const grad = ctx.createLinearGradient(0, padT, 0, padT + plotH);
  grad.addColorStop(0, 'hsla(160,84%,39%,0.30)');
  grad.addColorStop(1, 'hsla(160,84%,39%,0.00)');

  const xPos = i => padL + (i / (n - 1)) * plotW;
  const yPos = v => padT + plotH - (v / maxVal) * plotH;

  // Area
  ctx.beginPath();
  ctx.moveTo(xPos(0), yPos(values[0]));
  for (let i = 1; i < n; i++) {
    const cpx = (xPos(i-1) + xPos(i)) / 2;
    ctx.bezierCurveTo(cpx, yPos(values[i-1]), cpx, yPos(values[i]), xPos(i), yPos(values[i]));
  }
  ctx.lineTo(xPos(n-1), padT + plotH);
  ctx.lineTo(xPos(0),   padT + plotH);
  ctx.closePath();
  ctx.fillStyle = grad;
  ctx.fill();

  // Line
  ctx.beginPath();
  ctx.moveTo(xPos(0), yPos(values[0]));
  for (let i = 1; i < n; i++) {
    const cpx = (xPos(i-1) + xPos(i)) / 2;
    ctx.bezierCurveTo(cpx, yPos(values[i-1]), cpx, yPos(values[i]), xPos(i), yPos(values[i]));
  }
  ctx.strokeStyle = 'hsl(160,84%,39%)';
  ctx.lineWidth = 2;
  ctx.stroke();

  // Dots
  ctx.fillStyle = 'hsl(160,84%,39%)';
  for (let i = 0; i < n; i++) {
    ctx.beginPath();
    ctx.arc(xPos(i), yPos(values[i]), 3, 0, Math.PI * 2);
    ctx.fill();
  }

  // Labels
  document.getElementById('chart-x-labels').innerHTML = labels.map(l => `<span>${l}</span>`).join('');
  const yMax = Math.ceil(maxVal / 10) * 10;
  document.getElementById('chart-y-axis').innerHTML = [yMax, Math.round(yMax*0.75), Math.round(yMax*0.5), Math.round(yMax*0.25), 0]
    .map(v => `<span>${v}</span>`).join('');
}


/* ══════════════════════════════════════════════════════════════
   DASHBOARD — DONUT CHART (Canvas)
══════════════════════════════════════════════════════════════ */

function drawDonut(data) {
  
  const APPT_TYPES = [
    { name: "Face to face",     color: "hsl(0,72%,51%)"   },
    { name: "Zoom",             color: "hsl(38,92%,50%)"  },
    { name: "Not interested",   color: "hsl(217,91%,60%)" },
    { name: "Never Pick Up",    color: "hsl(280,65%,60%)" },
    { name: "Not in use",       color: "hsl(255, 97%, 48%)" },
    { name: "Wrong Number",     color: "hsl(95, 97%, 48%)"},
    { name: "Call back",        color: "hsl(178, 100%, 52%)" }
  ];
  //const values = (APPT_TYPE_DATA[agent] || APPT_TYPE_DATA.all)[period];
  const total  = data.reduce((s,v) => s+v, 0);

  const canvas = document.getElementById('donut-canvas');
  canvas.width = canvas.height = 160;
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, 160, 160);

  const cx=80, cy=80, r=58, innerR=36;
  let startAngle = -Math.PI / 2;

  data.forEach((val, i) => {
    const slice = (val / total) * Math.PI * 2;
    ctx.beginPath();
    ctx.arc(cx, cy, r, startAngle, startAngle + slice);
    ctx.arc(cx, cy, innerR, startAngle + slice, startAngle, true);
    ctx.closePath();
    ctx.fillStyle = APPT_TYPES[i].color;
    ctx.fill();
    startAngle += slice;
  });

  document.getElementById('donut-legend').innerHTML = APPT_TYPES.map((t, i) => `
    <div class="legend-item">
      <span class="dot-sm" style="background:${t.color}"></span>
      <span class="legend-label">${t.name}</span>
      <span class="legend-count">${data[i]}</span>
      <span class="legend-pct">${Math.round((data[i]/total)*100)}%</span>
    </div>
  `).join('');
}


/* ══════════════════════════════════════════════════════════════
   DASHBOARD — APPOINTMENTS TABLE
══════════════════════════════════════════════════════════════ */

function renderTable(agent,data) {
  const TYPE_BADGE = {
    "Face to face":   "badge-green",
    "Zoom":           "badge-blue",
    "Not interested": "badge-red",
    "Never Pick Up":  "badge-gray",
    "Not in use":     "badge-gray",
  };


  const tbody = document.getElementById('appt-tbody');
  if (!data.length) {
    tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;color:var(--muted);padding:32px">No appointments found for this filter.</td></tr>`;
    return;
  }

  const agenthead = (agent==="All Agents")? `<th>Agent</th>`: ""
  const thead = document.getElementById('head-table');
  thead.innerHTML = `<tr>
                  <th>Call Date</th>
                  <th>Source</th>
                  <th>Client Name</th>
                  <th>Appt. Date</th>
                  <th>Appt. Time</th>
                  <th>Location</th>
                  <th>Type</th>
                  ${agenthead}
                </tr>`;

const agentbody =""
  tbody.innerHTML = data.map(a => 
    
      `
        <tr>
          <td class="muted">${a[0]}</td>
          <td>${a[1]}</td>
          <td>${a[2]}</td>
          <td>${a[3]}</td>
          <td>${a[4]}</td>
          <td style="max-width:180px;overflow:hidden;text-overflow:ellipsis" title="${a[5]}">${a[5]}</td>
          <td><span class="badge ${TYPE_BADGE[a[6]] || 'badge-gray'}">${a[6]}</span></td>
          ${(agent==="All Agents")? `<td>${a[7]}</td>`: ""}
        </tr>
      `
    ).join('');

  
}

/* ══════════════════════════════════════════════════════════════
   Backend requests
══════════════════════════════════════════════════════════════ */
    async function fetchBackendData(url) {
        
        let _ret = ""
        try {

            // The URL should match your backend server and endpoint
            const response = await fetch(url);

            if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
            }

            _ret = await response.json(); // Parse the response body as JSON

        } catch (error) {

            console.log(error);
        }

        return _ret
    }


    async function fetchFile(url,path,filename) { 

      const name = encodeURIComponent(filename)
      const folder =  encodeURIComponent(path)
        
      fetch(`${url}?name=${name}&folder=${folder}`)
        .then(res => res.blob())
        .then(blob => {
          const url = window.URL.createObjectURL(blob);

          const a = document.createElement('a');
          a.href = url;
          a.download = filename; 
          a.click();

        });
    }

    async function fetchStats(url,agent,start,end) {
        
        const agentname = encodeURIComponent(agent)
        const sdate = encodeURIComponent(start)
        const edate = encodeURIComponent(end)
        const furl =  `${url}?agent=${agentname}&sdate=${sdate}&edate=${edate}`
        try {

            // The URL should match your backend server and endpoint
            const response = await fetch(furl);

            if (!response.ok) {
              throw new Error(`HTTP error! status: ${response.status}`);
            }

            return await response.json(); // Parse the response body as JSON

        } catch (error) { console.warn(error); }
    }

/* ══════════════════════════════════════════════════════════════
   INIT
══════════════════════════════════════════════════════════════ */

// document.addEventListener('DOMContentLoaded', () => {
//   showPage('terminal');
//   window.addEventListener('resize', () => {
//     if (document.getElementById('page-dashboard').style.display !== 'none') {
//       const agent  = document.getElementById('agent-filter').value;
//       const period = document.getElementById('period-filter').value;
//       drawLineChart(agent, period);
//     }
//   });
// });