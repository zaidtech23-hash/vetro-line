// ═══════════════════════════════════════════════════════════════
// MÓDULO: AGENDA (calendário)
// ═══════════════════════════════════════════════════════════════

const Agenda = {

  currentMonth: new Date().getMonth(),
  currentYear: new Date().getFullYear(),
  events: [],

  async load() {
    await this.loadEvents();
    this.renderCalendar();
  },

  async loadEvents() {
    const startOfMonth = new Date(this.currentYear, this.currentMonth, 1).toISOString().split('T')[0];
    const endOfMonth = new Date(this.currentYear, this.currentMonth + 1, 0).toISOString().split('T')[0];

    const { data, error } = await sb
      .from('service_orders')
      .select('id, os_number, title, due_date, status, scheduled_at, clients(name), profiles(name)')
      .or(`due_date.gte.${startOfMonth},scheduled_at.gte.${startOfMonth}`)
      .order('due_date');

    if (error) {
      console.error(error);
      this.events = [];
      return;
    }

    this.events = data || [];
  },

  renderCalendar() {
    const months = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
    document.getElementById('calendarTitle').textContent = `${months[this.currentMonth]} de ${this.currentYear}`;

    const firstDay = new Date(this.currentYear, this.currentMonth, 1);
    const lastDay = new Date(this.currentYear, this.currentMonth + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startWeekday = firstDay.getDay();
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];

    const grid = document.getElementById('calendarGrid');
    let html = '';

    // Cabeçalho dos dias
    ['DOM','SEG','TER','QUA','QUI','SEX','SÁB'].forEach(d => {
      html += `<div class="calendar-weekday">${d}</div>`;
    });

    // Espaços vazios antes do dia 1
    for (let i = 0; i < startWeekday; i++) {
      html += '<div class="calendar-day empty"></div>';
    }

    // Dias do mês
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${this.currentYear}-${String(this.currentMonth+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
      const dayEvents = this.events.filter(e => 
        e.due_date === dateStr || (e.scheduled_at && e.scheduled_at.startsWith(dateStr))
      );

      const isToday = dateStr === todayStr;
      const hasEvents = dayEvents.length > 0;

      html += `
        <div class="calendar-day ${isToday ? 'today' : ''} ${hasEvents ? 'has-events' : ''}" 
             onclick="Agenda.openDay('${dateStr}')">
          <div class="calendar-day-num">${day}</div>
          <div class="calendar-day-events">
            ${dayEvents.slice(0, 2).map(e => `<div class="calendar-event-mini" title="${e.title}">${e.title}</div>`).join('')}
            ${dayEvents.length > 2 ? `<div class="calendar-event-mini">+${dayEvents.length-2}</div>` : ''}
          </div>
        </div>
      `;
    }

    grid.innerHTML = html;

    // Lista de próximos eventos abaixo do calendário
    this.renderUpcoming();
  },

  renderUpcoming() {
    const container = document.getElementById('upcomingEvents');
    if (!container) return;

    const today = new Date().toISOString().split('T')[0];
    const upcoming = this.events
      .filter(e => e.due_date >= today)
      .sort((a, b) => (a.due_date || '').localeCompare(b.due_date || ''))
      .slice(0, 10);

    if (upcoming.length === 0) {
      container.innerHTML = '<div class="empty-state"><div class="title">Nenhum serviço agendado</div></div>';
      return;
    }

    container.innerHTML = upcoming.map(e => `
      <div class="list-item">
        <div class="dot ${e.status === 'done' ? 'done' : e.status === 'in_field' ? 'going' : 'wait'}"></div>
        <div class="flex-1">
          <div class="item-name">${e.title}</div>
          <div class="item-sub">${Utils.formatDate(e.due_date)} · ${e.clients?.name || '—'} · ${e.profiles?.name || 'Sem responsável'}</div>
        </div>
        <span class="tag ${e.status}">${Utils.statusLabel(e.status)}</span>
      </div>
    `).join('');
  },

  prevMonth() {
    this.currentMonth--;
    if (this.currentMonth < 0) {
      this.currentMonth = 11;
      this.currentYear--;
    }
    this.load();
  },

  nextMonth() {
    this.currentMonth++;
    if (this.currentMonth > 11) {
      this.currentMonth = 0;
      this.currentYear++;
    }
    this.load();
  },

  goToToday() {
    this.currentMonth = new Date().getMonth();
    this.currentYear = new Date().getFullYear();
    this.load();
  },

  async openDay(dateStr) {
    const dayEvents = this.events.filter(e => 
      e.due_date === dateStr || (e.scheduled_at && e.scheduled_at.startsWith(dateStr))
    );

    document.getElementById('dayDetailTitle').textContent = `📅 ${Utils.formatDate(dateStr)}`;
    
    const body = document.getElementById('dayDetailBody');
    if (dayEvents.length === 0) {
      body.innerHTML = `
        <div class="empty-state">
          <div class="icon">📅</div>
          <div class="title">Nenhum serviço agendado</div>
          <div class="sub">Esse dia tá livre!</div>
        </div>
        ${App.isAdmin() ? `
          <button class="btn-primary" onclick="Agenda.scheduleNew('${dateStr}')">➕ Agendar Serviço</button>
        ` : ''}
      `;
    } else {
      body.innerHTML = dayEvents.map(e => `
        <div class="list-item">
          <div class="dot ${e.status === 'done' ? 'done' : e.status === 'in_field' ? 'going' : 'wait'}"></div>
          <div class="flex-1">
            <div class="item-name">${e.title}</div>
            <div class="item-sub">${e.clients?.name || '—'} · ${e.profiles?.name || 'Sem responsável'}</div>
          </div>
          <span class="tag ${e.status}">${Utils.statusLabel(e.status)}</span>
        </div>
      `).join('') + (App.isAdmin() ? `
        <button class="btn-primary mt-16" onclick="Agenda.scheduleNew('${dateStr}')">➕ Agendar mais um</button>
      ` : '');
    }

    Utils.openModal('dayDetailModal');
  },

  scheduleNew(dateStr) {
    Utils.closeModal('dayDetailModal');
    // Vai pra ordens com a data preenchida
    if (typeof Ordens !== 'undefined') {
      App.showScreen('ordens').then(() => {
        Ordens.openNew();
        document.getElementById('os_due_date').value = dateStr;
      });
    }
  }

};
