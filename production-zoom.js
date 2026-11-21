(() => {
  const root = document.querySelector('[data-production-zoom]');
  if (!root) return;

  const stage = root.querySelector('[data-zoom-stage]');
  const range = root.querySelector('[data-zoom-range]');
  const title = root.querySelector('[data-zoom-title]');
  const copy = root.querySelector('[data-zoom-copy]');
  const useCase = root.querySelector('[data-zoom-use-case]');
  const useCaseText = root.querySelector('[data-zoom-use-case-text]');
  const stepLabel = root.querySelector('[data-zoom-step]');
  const detailBack = root.querySelector('[data-detail-back]');
  const tabs = [...root.querySelectorAll('[data-zoom-tab]')];
  const detailDiagram = root.querySelector('.detail-diagram');
  const sceneGroups = [...stage.querySelectorAll('.zoom-scene > .scene-container, .zoom-scene > .scene-connected, .zoom-scene > .scene-scale, .zoom-scene > .scene-local, .zoom-scene > .scene-multicluster, .zoom-scene > .scene-world')];
  const detailFields = {
    heading: root.querySelector('[data-detail-heading]'),
    subheading: root.querySelector('[data-detail-subheading]'),
    left: root.querySelector('[data-detail-left]'),
    center: root.querySelector('[data-detail-center]'),
    right: root.querySelector('[data-detail-right]'),
    linkLeft: root.querySelector('[data-detail-link-left]'),
    linkRight: root.querySelector('[data-detail-link-right]'),
    note: root.querySelector('[data-detail-note]')
  };
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
  const details = {
    container: {
      title: 'What the container gives you',
      copy: 'A container runs an application in a packaged, repeatable environment. Docker builds an image; starting that image creates a running container.',
      use: 'Use it to move the same model service and its runtime dependencies from a laptop or CI job to a server. Model weights may be bundled in the image or loaded from a model store.',
      left: 'DOCKERFILE', center: 'IMAGE', right: 'CONTAINER', in: 'BUILD', out: 'RUN', note: 'One image can start many containers.'
    },
    model: {
      title: 'The model is one part of inference',
      copy: 'Serving code loads the model, checks the input shape, applies preprocessing, and formats the prediction. Keep those steps compatible with the model version.',
      use: 'A model API is useful when an application needs a prediction such as a category, score, or recommendation during a user request.',
      left: 'INPUT + SCHEMA', center: 'MODEL + CODE', right: 'PREDICTION', in: 'VALIDATE', out: 'INFER', note: 'Version the model and its input contract together.'
    },
    api: {
      title: 'A direct API call',
      copy: 'The caller sends a request to the model service and waits for its response. HTTP is a common transport; the API defines the request and response shape.',
      use: 'Use this for an interactive prediction where the caller needs an answer now—for example, rank these results or score this application.',
      left: 'APP / CLIENT', center: 'MODEL API', right: 'JSON RESULT', in: 'HTTPS REQUEST', out: 'RESPONSE', note: 'The caller and service agree on an input schema.'
    },
    database: {
      title: 'The model needs current context',
      copy: 'A serving app may read a small amount of current state or precomputed features before inference. A database client or feature-store API makes that data available.',
      use: 'Read a user’s latest preferences or an item’s current features for a prediction. Keep large historical training reads in an offline data pipeline.',
      left: 'MODEL SERVICE', center: 'FEATURE / DB', right: 'MODEL INPUT', in: 'QUERY', out: 'FEATURES', note: 'Keep training and serving feature definitions aligned.'
    },
    messaging: {
      title: 'Kafka and Pub/Sub move events',
      copy: 'A producer publishes an event to a topic. Consumers process it independently, so the producer does not need to wait for each worker to finish.',
      use: 'Use an event stream when clicks, transactions, or sensor updates should trigger logging, feature updates, or background work. Kafka can retain event logs for consumers to replay; managed Pub/Sub is another publish/subscribe option.',
      left: 'PRODUCER', center: 'KAFKA / PUB/SUB', right: 'CONSUMER', in: 'PUBLISH', out: 'DELIVER', note: 'Good for asynchronous work; not a replacement for every direct API call.'
    },
    worker: {
      title: 'A worker handles work later',
      copy: 'A worker consumes queued or streamed events and performs a task without holding open the original user request.',
      use: 'Move slower jobs—such as document enrichment, image processing, or batch scoring—off the interactive response path. The worker can save a result for another service to read.',
      left: 'TOPIC / QUEUE', center: 'WORKER', right: 'SAVED RESULT', in: 'EVENT', out: 'WRITE', note: 'Workers can be scaled separately from the model API.'
    },
    service: {
      title: 'A stable address hides changing Pods',
      copy: 'A Kubernetes Service gives a changing group of ready Pods a stable network name. Callers use the Service address instead of tracking each copy.',
      use: 'Put a Service in front of model replicas so a deployment can replace or scale Pods without changing the application’s endpoint.',
      left: 'CLIENT', center: 'SERVICE', right: 'READY POD', in: 'REQUEST', out: 'ROUTE', note: 'The Service selects backends; readiness keeps unready Pods out.'
    },
    replicas: {
      title: 'Replicas add parallel capacity',
      copy: 'A controller keeps the requested number of interchangeable model Pods running. A Service routes requests among ready copies.',
      use: 'Add replicas when concurrent request volume exceeds one instance’s capacity. Replicas usually run the same model version; they do not make one prediction faster by themselves.',
      left: 'REQUESTS', center: 'MODEL REPLICAS', right: 'MORE THROUGHPUT', in: 'DISTRIBUTE', out: 'RESPOND', note: 'Scaling copies costs more compute and needs capacity planning.'
    },
    'local-cluster': {
      title: 'Kubernetes manages the local cluster',
      copy: 'A cluster is the boundary where Kubernetes schedules and supervises workloads. Pods can be replaced while Services give callers stable names.',
      use: 'Use a local Kubernetes distribution to learn deployment, Service, and configuration concepts before moving the same containerized workload to a hosted cluster.',
      left: 'DEPLOYMENT', center: 'LOCAL CLUSTER', right: 'SERVICE + PODS', in: 'DESIRED STATE', out: 'RECONCILE', note: 'Kubernetes operates the workload; it does not improve model quality.'
    },
    cluster: {
      title: 'A cluster is one operating boundary',
      copy: 'Each cluster has its own network and services. A workload in one cluster does not automatically discover or securely reach a workload in another.',
      use: 'Separate clusters may serve different regions, environments, or teams. A private route, gateway, and service identity connect them deliberately.',
      left: 'CLUSTER A', center: 'NETWORK + GATEWAY', right: 'CLUSTER B', in: 'ROUTE', out: 'AUTHENTICATE', note: 'Cluster-to-cluster networking must be designed and secured.'
    },
    'inter-cluster': {
      title: 'Cross-cluster calls need a route',
      copy: 'The services need reachable addresses, a network path, and a way to verify each other. A gateway or service-mesh layer can provide these pieces.',
      use: 'Connect a model service in one region to a data or feature service in another. Protect the link with identity checks and encrypted transport.',
      left: 'MODEL SERVICE', center: 'GATEWAY / TLS', right: 'DATA SERVICE', in: 'HTTPS / gRPC', out: 'AUTHORIZED CALL', note: 'Exact tools depend on the cloud and network design.'
    },
    user: {
      title: 'The user starts a request',
      copy: 'A browser or app calls a public endpoint. The endpoint routes the request into the model service and returns the prediction to the caller.',
      use: 'Expose only the API the application needs, with authentication, rate limits, and input validation at the edge.',
      left: 'PERSON + APP', center: 'PUBLIC ENDPOINT', right: 'MODEL API', in: 'HTTPS', out: 'PREDICTION', note: 'The user interacts with an API, not directly with a Pod.'
    },
    internet: {
      title: 'The internet connects networks',
      copy: 'Internet routing carries traffic between networks. DNS helps a client find a service name; a public gateway or load balancer can forward the request to a backend.',
      use: 'Make a model service reachable to external users through a domain and controlled public endpoint. The internet is not made up of Kubernetes clusters.',
      left: 'USER NETWORK', center: 'INTERNET + DNS', right: 'SERVICE NETWORK', in: 'ROUTE', out: 'GATEWAY', note: 'A cluster may host the service behind the endpoint.'
    }
  };
  let level = 0;
  let pointerStart = null;
  let lastDetailTarget = null;

  const syncSceneAccess = () => {
    const inDetail = stage.hasAttribute('data-detail');
    sceneGroups.forEach((scene, index) => {
      const active = !inDetail && index === level;
      scene.setAttribute('aria-hidden', String(!active));
      scene.querySelectorAll('[data-detail]').forEach((target) => {
        target.setAttribute('tabindex', active ? '0' : '-1');
      });
    });
    detailDiagram.setAttribute('aria-hidden', String(!inDetail));
  };

  const closeDetail = (restoreFocus = false) => {
    stage.removeAttribute('data-detail');
    stage.setAttribute('aria-label', 'Use the controls to zoom out from one model container to the internet');
    root.removeAttribute('data-detail-open');
    detailBack.hidden = true;
    useCase.hidden = true;
    syncSceneAccess();
    lastDetailTarget?.setAttribute('aria-pressed', 'false');
    if (restoreFocus && lastDetailTarget?.isConnected) lastDetailTarget.focus();
    lastDetailTarget = null;
  };

  const openDetail = (key, target) => {
    const detail = details[key];
    if (!detail) return;
    closeDetail();
    lastDetailTarget = target;
    target?.setAttribute('aria-pressed', 'true');
    stage.dataset.detail = key;
    stage.setAttribute('aria-label', `${detail.title}. Press Escape or choose Back to stage to return.`);
    root.dataset.detailOpen = 'true';
    detailBack.hidden = false;
    detailFields.heading.textContent = detail.title.toUpperCase();
    detailFields.subheading.textContent = `${detail.left} → ${detail.center} → ${detail.right}`;
    detailFields.left.textContent = detail.left;
    detailFields.center.textContent = detail.center;
    detailFields.right.textContent = detail.right;
    detailFields.linkLeft.textContent = detail.in;
    detailFields.linkRight.textContent = detail.out;
    detailFields.note.textContent = detail.note;
    title.textContent = detail.title;
    copy.textContent = detail.copy;
    useCaseText.textContent = detail.use;
    useCase.hidden = false;
    stepLabel.textContent = `0${level + 1} / 0${steps.length} · DETAIL`;
    syncSceneAccess();
    stage.focus();
  };

  const setLevel = (next) => {
    closeDetail();
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
    syncSceneAccess();
  };

  root.querySelector('[data-zoom-in]').addEventListener('click', () => setLevel(level - 1));
  root.querySelector('[data-zoom-out]').addEventListener('click', () => setLevel(level + 1));
  root.querySelector('[data-zoom-reset]').addEventListener('click', () => setLevel(0));
  detailBack.addEventListener('click', () => closeDetail(true));
  range.addEventListener('input', () => setLevel(Number(range.value)));

  root.addEventListener('click', (event) => {
    const target = event.target.closest('[data-detail]');
    if (target && root.contains(target)) openDetail(target.dataset.detail, target);
  });
  root.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && stage.hasAttribute('data-detail')) {
      event.preventDefault();
      closeDetail(true);
      return;
    }
    const target = event.target.closest('[data-detail]');
    if (target && (event.key === 'Enter' || event.key === ' ')) {
      event.preventDefault();
      openDetail(target.dataset.detail, target);
    }
  });

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
    if (event.target !== stage) return;
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
    if (event.button !== 0 || event.target.closest('[data-detail], button, input')) return;
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
