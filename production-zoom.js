(() => {
  const root = document.querySelector('[data-production-zoom]');
  if (!root) return;

  const stage = root.querySelector('[data-zoom-stage]');
  const range = root.querySelector('[data-zoom-range]');
  const title = root.querySelector('[data-zoom-title]');
  const copy = root.querySelector('[data-zoom-copy]');
  const stepLabel = root.querySelector('[data-zoom-step]');
  const tabs = [...root.querySelectorAll('[data-zoom-tab]')];
  const steps = [
    {
      title: 'One container. One model.',
      copy: 'Start with the model service in its own container. Zoom out to see what must connect around it.'
    },
    {
      title: 'Containers exchange requests and events',
      copy: 'A model can call a database through an API or database client. Kafka or Pub/Sub carries events asynchronously to workers. Airflow and Flyte can orchestrate data or ML jobs around this service; they are not required in the live request path.'
    },
    {
      title: 'One service, many copies',
      copy: 'When requests grow, run more copies of the model service. A stable address or load balancer sends requests across the available copies.'
    },
    {
      title: 'Kubernetes manages one local cluster',
      copy: 'A cluster groups machines and runs containers as Pods. Kubernetes keeps the requested copies running and gives the service a stable address. You can learn this locally before using cloud infrastructure.'
    },
    {
      title: 'Systems can communicate across clusters',
      copy: 'A service in one cluster can call a service in another through an API, gateway, or messaging system. Teams must configure routing, service discovery, identity, and network security.'
    },
    {
      title: 'A service becomes reachable over the internet',
      copy: 'The internet connects networks and users to public endpoints. Kubernetes clusters may run services behind those endpoints; clusters are not what the internet itself is made of.'
    }
  ];
  let level = 0;
  let pointerStart = null;

  const setLevel = (next) => {
    level = Math.max(0, Math.min(steps.length - 1, next));
    stage.dataset.level = String(level);
    range.value = String(level);
    title.textContent = steps[level].title;
    copy.textContent = steps[level].copy;
    stepLabel.textContent = `0${level + 1} / 0${steps.length}`;
    range.setAttribute('aria-valuetext', `Stage ${level + 1} of ${steps.length}: ${tabs[level].textContent.trim()}`);
    tabs.forEach((tab, index) => {
      const selected = index === level;
      tab.setAttribute('aria-selected', String(selected));
      tab.tabIndex = selected ? 0 : -1;
    });
  };

  root.querySelector('[data-zoom-in]').addEventListener('click', () => setLevel(level - 1));
  root.querySelector('[data-zoom-out]').addEventListener('click', () => setLevel(level + 1));
  root.querySelector('[data-zoom-reset]').addEventListener('click', () => setLevel(0));
  range.addEventListener('input', () => setLevel(Number(range.value)));

  tabs.forEach((tab) => {
    tab.addEventListener('click', () => setLevel(Number(tab.dataset.zoomTab)));
    tab.addEventListener('keydown', (event) => {
      let next = level;
      if (event.key === 'ArrowRight' || event.key === 'ArrowDown') next = (level + 1) % tabs.length;
      else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') next = (level + tabs.length - 1) % tabs.length;
      else if (event.key === 'Home') next = 0;
      else if (event.key === 'End') next = tabs.length - 1;
      else return;
      event.preventDefault();
      setLevel(next);
      tabs[next].focus();
    });
  });

  stage.addEventListener('wheel', (event) => {
    if (Math.abs(event.deltaY) < 5) return;
    event.preventDefault();
    setLevel(level + (event.deltaY > 0 ? 1 : -1));
  }, { passive: false });

  stage.addEventListener('keydown', (event) => {
    if (['ArrowRight', 'ArrowDown', '-', '_'].includes(event.key)) {
      event.preventDefault();
      setLevel(level + 1);
    } else if (['ArrowLeft', 'ArrowUp', '+', '='].includes(event.key)) {
      event.preventDefault();
      setLevel(level - 1);
    } else if (event.key === 'Home') {
      event.preventDefault();
      setLevel(0);
    } else if (event.key === 'End') {
      event.preventDefault();
      setLevel(steps.length - 1);
    }
  });

  stage.addEventListener('pointerdown', (event) => {
    if (event.button !== 0) return;
    pointerStart = { x: event.clientX, y: event.clientY };
    stage.setPointerCapture(event.pointerId);
  });
  stage.addEventListener('pointerup', (event) => {
    if (!pointerStart) return;
    const dx = event.clientX - pointerStart.x;
    const dy = event.clientY - pointerStart.y;
    if (Math.abs(dx) > 52 && Math.abs(dx) > Math.abs(dy)) setLevel(level + (dx < 0 ? 1 : -1));
    pointerStart = null;
  });
  stage.addEventListener('pointercancel', () => { pointerStart = null; });

  setLevel(0);
})();
