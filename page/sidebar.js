import {applyFilters} from "./dashboard.js"
import { renderLogs } from "./terminal.js";

const nav_terminal = document.getElementById('nav-terminal');
const nav_dashboard = document.getElementById('nav-dashboard');
            
 nav_dashboard.addEventListener('click', 
(event) => {
  showPage(event,'dashboard');
});
 nav_terminal.addEventListener('click', 
(event) => {
  showPage(event,'terminal');
});

/* ══════════════════════════════════════════════════════════════
   NAVIGATION
══════════════════════════════════════════════════════════════ */

function showPage(event,page) {
  console.log(page)
  document.getElementById('page-terminal').style.display  = page === 'terminal'  ? 'flex' : 'none';
  document.getElementById('page-dashboard').style.display = page === 'dashboard' ? 'flex' : 'none';

  document.getElementById('nav-terminal').classList.toggle('active',  page === 'terminal');
  document.getElementById('nav-dashboard').classList.toggle('active', page === 'dashboard');

  document.getElementById('dot-terminal').style.display  = page === 'terminal'  ? 'inline-block' : 'none';
  document.getElementById('dot-dashboard').style.display = page === 'dashboard' ? 'inline-block' : 'none';

  if (page === 'dashboard') applyFilters();
  if (page === 'terminal') renderLogs();
}


/* ══════════════════════════════════════════════════════════════
   SIDEBAR COLLAPSE
══════════════════════════════════════════════════════════════ */

function toggleSidebar() {
  document.getElementById('sidebar').classList.toggle('collapsed');
}
