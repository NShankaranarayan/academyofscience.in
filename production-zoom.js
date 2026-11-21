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
    note: root.querySelector('[data-detail-note]'),
    noteMore: root.querySelector('[data-detail-note-more]'),
    railTag: root.querySelector('[data-detail-rail-tag]'),
    cards: [...root.querySelectorAll('[data-detail-card]')],
    links: [...root.querySelectorAll('[data-detail-link]')],
    linkLabels: [...root.querySelectorAll('[data-detail-link-label]')]
  };
  const steps = [
    {
      title: 'One container. One model.',
      copy: 'For our photo app: decode and resize the image, run the cat/dog model, then return a label and confidence score. The container packages the code and runtime for that prediction.'
    },
    {
      title: 'A direct request, with optional side paths',
      copy: 'The photo app calls the model API and waits. A data lookup or event worker is optional; Airflow and Flyte coordinate scheduled data or ML jobs separately from the live request.'
    },
    {
      title: 'One service, many copies',
      copy: 'When more people send photos at once, add independent copies of the model service. A stable address shares requests across ready copies; an autoscaler can adjust the count from chosen metrics.'
    },
    {
      title: 'Kubernetes manages one cluster',
      copy: 'Kubernetes can manage the model copies as Pods, keep the requested count running, and give them a stable address. A cluster can be local for learning or hosted; a managed endpoint can handle this layer for you.'
    },
    {
      title: 'Systems can communicate across clusters',
      copy: 'A service in one cluster can call a service in another through a deliberate network route. Multiple clusters are an advanced choice for needs such as regions or isolation, and add routing and security work.'
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
      use: 'Build the image on your laptop or in CI, push it to an image registry, then deploy it on a server or managed endpoint. Large model weights may be loaded separately from a model store.',
      left: 'DOCKERFILE', center: 'IMAGE', right: 'CONTAINER', in: 'BUILD', out: 'RUN', note: 'One image can start many containers.'
    },
    model: {
      title: 'The model is one part of inference',
      copy: 'Serving code decodes and resizes the photo, applies the same normalization used in training, runs the model, then formats its output. The model weights alone are not the complete prediction service.',
      use: 'For a cat/dog app, the response could be a label and confidence such as `cat, 0.98`. The app can show the result as soon as the API responds.',
      left: 'INPUT + SCHEMA', center: 'MODEL + CODE', right: 'PREDICTION', in: 'VALIDATE', out: 'INFER', note: 'Version the model and its input contract together.'
    },
    api: {
      title: 'A direct API call',
      copy: 'The caller sends a request to the model service and waits for its response. HTTP is a common transport; the API defines the request and response shape.',
      use: 'Use this for an interactive prediction where the caller needs an answer now. A photo app sends an image and gets back a label such as `cat` with a confidence score.',
      left: 'APP / CLIENT', center: 'MODEL API', right: 'JSON RESULT', in: 'HTTPS REQUEST', out: 'RESPONSE', note: 'The caller and service agree on an input schema.'
    },
    database: {
      title: 'The model needs current context',
      copy: 'A serving app may read a small amount of current state or precomputed features before inference. A database client or feature-store API makes that data available.',
      use: 'Read a user’s latest preferences or an item’s current features for a prediction. Keep large historical training reads in an offline data pipeline.',
      left: 'MODEL SERVICE', center: 'FEATURE / DB', right: 'MODEL INPUT', in: 'QUERY', out: 'FEATURES', note: 'Keep training and serving feature definitions aligned.'
    },
    messaging: {
      title: 'Event messaging: Kafka or Pub/Sub',
      copy: 'Both let producers publish messages for independent consumers. Kafka is an event-streaming platform with retained topic logs; Pub/Sub is a managed messaging service using topics and subscriptions. Their delivery and operating models differ.',
      use: 'Use asynchronous messaging when clicks, transactions, or sensor updates should trigger background work without making the caller wait. Choose based on retention, replay, delivery guarantees, operations, and cloud needs—not because the two products are identical.',
      left: 'PRODUCER', center: 'EVENT SERVICE', right: 'CONSUMER', in: 'PUBLISH', out: 'DELIVER', note: 'Related patterns, different products; neither replaces every direct API call.'
    },
    worker: {
      title: 'A worker handles work later',
      copy: 'A worker consumes queued or streamed events and performs a task without holding open the original user request. The API can return a job ID while the work continues.',
      use: 'Use this for a large photo or video job that takes too long for an interactive response. The app can check the job ID later; use a direct API for a quick cat/dog label.',
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
      use: 'If a photo app gets a traffic spike, extra copies can handle more simultaneous images. They do not make one image classify faster; new copies also need available CPU/GPU and time to start. Set limits to control capacity and cost.',
      left: 'REQUESTS', center: 'MODEL REPLICAS', right: 'MORE THROUGHPUT', in: 'DISTRIBUTE', out: 'RESPOND', note: 'Scaling copies costs more compute and needs capacity planning.'
    },
    'local-cluster': {
      title: 'Kubernetes manages one cluster',
      copy: 'A cluster is the boundary where Kubernetes schedules and supervises workloads. It may run locally for learning or be hosted. Pods can be replaced while Services give callers stable names.',
      use: 'Use a local Kubernetes distribution to learn deployment, Service, and configuration concepts. A production cluster is usually hosted or managed; a managed model endpoint may hide Kubernetes entirely.',
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
    orchestrator: {
      title: 'Airflow and Flyte coordinate workflows',
      copy: 'An orchestrator runs a sequence of tasks with dependencies, retries, and run history. It starts jobs; it is usually not the process answering each model API request.',
      use: 'Schedule a daily data refresh, then train and evaluate a model only after the data checks pass. Airflow and Flyte are options for coordinating these jobs, with different workflow models and operating tradeoffs.',
      left: 'TRIGGER', center: 'WORKFLOW', right: 'ML JOB', in: 'SCHEDULE', out: 'RUN', note: 'Useful for repeatable jobs outside live serving.'
    },
    'training-job': {
      title: 'A training job creates a candidate model',
      copy: 'A batch workflow reads a defined data snapshot, validates and transforms it, then trains and evaluates a candidate artifact.',
      use: 'Run training when new data or a planned schedule calls for it. Validate and register the candidate before releasing it to the serving API.',
      left: 'DATA', center: 'TRAINING JOB', right: 'MODEL ARTIFACT', in: 'PREPARE', out: 'REGISTER', note: 'Training happens separately from individual predictions.'
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
  const diagrams = {
    container: { type: 'build', subtitle: 'Build once, publish the image, then run it on chosen compute', focus: 3, rail: 'THE BUILD ARTIFACT', note: 'A registry stores the image for deployment. Inject secrets at runtime; large model weights may live in a model store.', links: ['BUILD', 'PUSH', 'PULL'], nodes: [['SOURCE', 'App + requirements', 'Inference code and', 'dependency list'], ['IMAGE', 'Docker image', 'Code and runtime', 'packaged together'], ['REGISTRY', 'Image registry', 'Stores the image', 'for deployment'], ['RUNTIME', 'Running container', 'Loads model and', 'serves predictions']] },
    model: { type: 'inference', subtitle: 'The complete prediction path around a model', focus: 2, rail: 'MODEL SERVING', note: 'Keep image decoding, resizing, and normalization consistent with training, or the model may see different inputs in production.', links: ['CHECK', 'PREPARE', 'SCORE'], nodes: [['REQUEST', 'Photo + request ID', 'Image bytes or', 'object reference'], ['GUARDRAIL', 'Decode + resize', 'Check file and apply', 'training transforms'], ['INFERENCE', 'Cat/dog model', 'Loads the versioned', 'model artifact'], ['RESPONSE', 'Label + confidence', 'Return `cat, 0.98`', 'to the calling app']] },
    api: { type: 'request', subtitle: 'A synchronous request: the caller waits for an answer', focus: 2, rail: 'WHEN TO USE AN API', note: 'Choose this path when the user-facing application needs a prediction before it can continue.', links: ['HTTPS', 'INFER', 'JSON'], nodes: [['CLIENT', 'Photo app', 'Sends an image', 'with a request ID'], ['REQUEST', 'HTTPS call', 'A direct request', 'to the endpoint'], ['ENDPOINT', 'Model API', 'Validates and runs', 'the prediction'], ['RESPONSE', 'JSON result', 'Returns `cat, 0.98`', 'to the waiting app']] },
    database: { type: 'data', subtitle: 'Fetch only the current context inference needs', focus: 1, rail: 'ONLINE VS. OFFLINE DATA', note: 'Serving usually reads a small, fast lookup. Historical data for training belongs in a separate offline pipeline.', links: ['LOOK UP', 'FEATURES', 'INFER'], nodes: [['IDENTIFIER', 'User / item ID', 'Request identifies', 'the entity'], ['ONLINE STORE', 'DB / feature API', 'Reads current state', 'or precomputed data'], ['FEATURES', 'Model inputs', 'Join context with', 'validated features'], ['INFERENCE', 'Model runtime', 'Uses the feature', 'vector to predict']] },
    messaging: { type: 'async', subtitle: 'An event path lets producers and consumers work independently', focus: 1, rail: 'RELATED PATTERNS · DIFFERENT PRODUCTS', note: 'Kafka retains topic logs according to configured retention, allowing consumers to replay within that window. Pub/Sub is a managed service built around topics and subscriptions with its own acknowledgment and retention settings.', links: ['PUBLISH', 'STORE / DELIVER', 'PROCESS'], nodes: [['PRODUCER', 'App / model API', 'Publishes a message', 'without awaiting work'], ['EVENT SERVICE', 'Kafka or Pub/Sub', 'Topics connect producers', 'to independent consumers'], ['CONSUMER', 'Worker group', 'Processes messages', 'and acknowledges'], ['SIDE EFFECT', 'Store / notify', 'Writes a result or', 'triggers next work']] },
    worker: { type: 'async', subtitle: 'A background worker handles work outside the request', focus: 1, rail: 'DESIGN FOR RETRIES', note: 'Return a job ID quickly, then let the app check status or receive a callback. Workers may retry, so repeated processing must be safe.', links: ['ACCEPT', 'PROCESS', 'SAVE'], nodes: [['CLIENT', 'Photo app', 'Submits a large', 'image or video'], ['API', 'Accept + job ID', 'Returns before the', 'long job completes'], ['WORKER', 'Consumer process', 'Processes the task', 'in the background'], ['RESULT', 'Saved status', 'App checks later', 'using the job ID']] },
    service: { type: 'routing', subtitle: 'A stable service name routes to ready application Pods', focus: 1, rail: 'KUBERNETES SERVICE', note: 'A readiness check tells Kubernetes when a model has loaded and can accept traffic. A Service is an in-cluster address; an Ingress or Gateway handles outside traffic.', links: ['DISCOVER', 'SELECT', 'FORWARD'], nodes: [['CALLER', 'App / client', 'Calls one stable', 'service name'], ['ADDRESS', 'Kubernetes Service', 'Selects matching', 'ready endpoints'], ['ENDPOINTS', 'Ready Pods', 'Unready copies are', 'not sent traffic'], ['APP', 'Model container', 'Handles the routed', 'request']] },
    replicas: { type: 'scale', subtitle: 'More independent copies share incoming requests', focus: 2, rail: 'REQUEST + CONTROL PATH', note: 'The request path is traffic → router → Pods. A separate autoscaler reads metrics and asks for more copies; new Pods still need available CPU/GPU, time to start, and budget.', links: ['ARRIVE', 'BALANCE', 'METRICS'], nodes: [['TRAFFIC', 'Concurrent requests', 'One copy reaches', 'its capacity'], ['ROUTER', 'Service / balancer', 'Shares work among', 'healthy copies'], ['PODS', 'Model 01 · 02 · 03', 'Independent copies', 'run the same version'], ['AUTOSCALER', 'Adjust replica count', 'Uses configured', 'metrics + limits']] },
    'local-cluster': { type: 'orchestration', subtitle: 'Kubernetes continually reconciles declared state', focus: 1, rail: 'WHAT KUBERNETES DOES', note: 'You declare the workload and desired copies. Kubernetes schedules Pods and replaces failed ones; the model still needs its own data and quality checks.', links: ['DECLARE', 'SCHEDULE', 'EXPOSE'], nodes: [['MANIFEST', 'Desired state', 'Image, config, and', 'replica count'], ['CONTROL PLANE', 'Kubernetes API', 'Stores state and', 'reconciles changes'], ['NODE', 'Pod + container', 'Runs model code on', 'available compute'], ['NETWORK', 'Service address', 'Provides a stable', 'in-cluster route']] },
    cluster: { type: 'network', subtitle: 'A cluster is a boundary for scheduling and operations', focus: [0, 2], rail: 'WHY USE MORE THAN ONE?', note: 'Teams may separate environments or regions. Each boundary adds independent configuration, access controls, monitoring, and operational work.', links: ['DEPLOY', 'CONNECT', 'SERVE'], nodes: [['CLUSTER A', 'Model service', 'Runs one workload', 'and its network'], ['ROUTE', 'Private gateway', 'Controls the path', 'between networks'], ['CLUSTER B', 'Data service', 'Has its own Pods', 'and service names'], ['POLICY', 'Identity + rules', 'Restricts which side', 'can call the other']] },
    'inter-cluster': { type: 'network', subtitle: 'Cross-cluster communication needs a deliberate route', focus: 1, rail: 'SECURE THE LINK', note: 'Use an explicit network path and authenticate the calling service; encryption protects traffic in transit.', links: ['CALL', 'ROUTE', 'AUTHORIZE'], nodes: [['CALLER', 'Model service', 'Requests data from', 'a remote service'], ['TRANSPORT', 'HTTPS / gRPC', 'Carries the call', 'across networks'], ['GATEWAY', 'Route + identity', 'Checks destination', 'and caller access'], ['DESTINATION', 'Data service', 'Returns only the', 'authorized response']] },
    orchestrator: { type: 'workflow', subtitle: 'Airflow and Flyte coordinate jobs around serving', focus: 0, rail: 'OUTSIDE THE LIVE REQUEST', note: 'Use an orchestrator to schedule, order, retry, and track data or ML jobs. A user prediction normally calls the model API directly.', links: ['TRIGGER', 'ORDER', 'PUBLISH'], nodes: [['SCHEDULE', 'Airflow / Flyte', 'Starts a defined', 'workflow run'], ['WORKFLOW', 'Task graph', 'Runs dependent', 'steps in order'], ['JOB', 'Train / score', 'Processes data or', 'creates predictions'], ['OUTPUT', 'Data / model', 'Stores a result for', 'a later workflow']] },
    'training-job': { type: 'workflow', subtitle: 'Batch jobs can prepare data or produce model versions', focus: 2, rail: 'TRAINING IS A SEPARATE PATH', note: 'A scheduled training job is not usually called for every user request. Publish its validated model artifact through a controlled release.', links: ['READ', 'TRANSFORM', 'TRAIN'], nodes: [['SOURCE', 'Historical data', 'Read a defined', 'dataset snapshot'], ['PIPELINE', 'Validate + prepare', 'Clean and build', 'training features'], ['TRAINING', 'ML job', 'Fit and evaluate', 'a candidate model'], ['REGISTRY', 'Model artifact', 'Version and approve', 'before serving']] },
    user: { type: 'edge', subtitle: 'The user reaches an endpoint, never a Pod directly', focus: 0, rail: 'THE PUBLIC EDGE', note: 'Authenticate callers, validate inputs, and apply rate limits before traffic reaches the model service.', links: ['SUBMIT', 'RESOLVE', 'FORWARD'], nodes: [['PERSON', 'Browser / app', 'User action starts', 'a prediction call'], ['NAME', 'DNS + HTTPS', 'Finds the public', 'service address'], ['EDGE', 'Gateway / endpoint', 'Applies access and', 'traffic policies'], ['SERVICE', 'Model API', 'Returns the score', 'to the application']] },
    internet: { type: 'edge', subtitle: 'The internet routes traffic between connected networks', focus: 2, rail: 'A SERVICE BEHIND A PUBLIC ADDRESS', note: 'DNS names the endpoint; routing carries packets; a gateway or load balancer forwards traffic to the private service network.', links: ['NAME', 'ROUTE', 'FORWARD'], nodes: [['CLIENT', 'User network', 'Starts with a', 'service domain'], ['DNS', 'Public address', 'Resolves the name', 'to an endpoint'], ['INTERNET', 'Network of networks', 'Routes traffic to', 'the destination'], ['BACKEND', 'Gateway → service', 'Forwards traffic to', 'a private workload']] }
  };
  const launchGuide = root.querySelector('[data-launch-guide]');
  const launchStages = [
    {
      name: 'CONTAINER', title: 'Package the prediction service',
      copy: 'This panel follows the stage selected above. For our photo app, inference code prepares an image, runs the cat/dog model, and returns a label. Choose hosted or self-managed serving.',
      routes: {
        managed: [['01 · PACKAGE', 'Model package', 'Version weights with preprocessing and the input contract.'], ['02 · HOST', 'Managed endpoint', 'Upload a supported package; configure runtime and access.'], ['03 · CALL', 'HTTPS request', 'The app sends a photo using the endpoint schema.'], ['04 · RESULT', 'Prediction', 'Return a label and confidence to the app.']],
        container: [['01 · WRAP', 'Inference app', 'Load weights, prepare the photo, expose a /predict route.'], ['02 · BUILD', 'Image + registry', 'Build the image and publish a version to a registry.'], ['03 · RUN', 'Container service', 'Run behind a stable endpoint with CPU/GPU and health settings.'], ['04 · RESULT', 'Prediction', 'Return the same label and confidence to the app.']]
      },
      notes: {
        managed: 'Managed endpoint: less infrastructure to operate, but you still own the model package, input contract, access rules, and monitoring.',
        container: 'Run your container: you choose the host and resources, and own health checks, capacity, scaling, and updates. Kubernetes is optional.'
      },
      cases: [
        ['Valid photo', 'POST /predict · supported photo', '200 · { "label": "cat", "score": 0.98 }', 'Compare with the expected label; record response time and errors.'],
        ['Bad input', 'POST /predict · unsupported file', '4xx · explain accepted formats; skip inference', 'Track rejected requests. Avoid logging uploaded image contents or credentials.'],
        ['Prep mismatch', 'Photo prepared differently from training', 'Prediction may be wrong even when the request succeeds', 'Compare preprocessing in training and serving before changing the model.']
      ]
    },
    {
      name: 'CONNECTED', title: 'Connect only what inference needs',
      copy: 'The app calls the model API and waits for a result. A data lookup or event worker is an optional side path; Airflow and Flyte coordinate separate jobs.',
      route: [['01 · INPUT', 'Photo app', 'Sends an image and waits for the prediction.'], ['02 · API', 'Model endpoint', 'Validates input, prepares it, runs inference.'], ['03 · RESPONSE', 'Label + score', 'Returns the prediction to the waiting app.'], ['OPTIONAL SIDE PATH', 'Event bus → worker', 'Use for work that can finish later, not every live call.', 'side']],
      notes: {
        managed: 'A hosted endpoint can serve the direct API. Add a database only for needed current context; use events for deferred work.',
        container: 'Your API should have a clear input/output contract. Add Kafka, Pub/Sub, or a database only when the use case needs it.'
      },
      cases: [
        ['Direct API', 'App needs the label now', 'Wait for the model API response', 'Keep the request small and within its timeout.'],
        ['Async job', 'Large photo batch or video', 'Return a job ID; worker finishes later', 'Persist status/result so the caller can retrieve it.'],
        ['No database', 'Self-contained cat/dog photo', 'Run inference without a data lookup', 'Avoid adding storage when the model does not need context.']
      ]
    },
    {
      name: 'REPLICAS', title: 'Share demand across model copies',
      copy: 'More replicas handle more simultaneous photos. The stable service routes to ready copies; scaling out does not make one prediction faster.',
      route: [['01 · TRAFFIC', 'Requests arrive', 'Several people submit photos at once.'], ['02 · ROUTE', 'Stable service', 'Distributes calls to ready copies.'], ['03 · SERVE', 'Model replicas', 'Each copy runs the same release independently.'], ['CONTROL PATH', 'Autoscaler', 'Reads configured metrics and adjusts count.', 'side']],
      notes: {
        managed: 'A managed endpoint may offer autoscaling settings. Choose metrics and bounds, then measure response time and spend.',
        container: 'Configure scaling explicitly. It reacts to metrics; new copies still need available CPU/GPU and time to start.'
      },
      cases: [
        ['Normal load', 'A few photos arrive', 'One or more copies answer', 'Measure baseline response time and resource use.'],
        ['Traffic spike', 'Many photos arrive at once', 'Latency rises; requests may queue, be rejected, or time out', 'Check CPU/GPU, queue depth, startup time, and replica limits; add capacity and retest.'],
        ['At capacity', 'Replica limit is reached', 'Extra demand can still wait or fail', 'Set limits and a deliberate overload response; scaling is not infinite.']
      ]
    },
    {
      name: 'ONE CLUSTER', title: 'Let Kubernetes manage one cluster',
      copy: 'Kubernetes schedules Pods and keeps the desired copies running. A Service gives ready Pods a stable internal address. The cluster can be local for learning or hosted for production.',
      route: [['01 · DECLARE', 'Deployment', 'Describe the image and desired replica count.'], ['02 · RECONCILE', 'Control plane', 'Schedules work and restores the desired state.'], ['03 · RUN', 'Pods on nodes', 'Each Pod runs the model container.'], ['04 · ROUTE', 'Service', 'Sends requests to ready Pods.']],
      notes: {
        managed: 'A managed model endpoint can hide Kubernetes. This stage shows a layer you might operate if you choose self-managed containers.',
        container: 'A local cluster is useful for learning. Running a hosted production cluster also means owning upgrades, access, capacity, and monitoring.'
      },
      cases: [
        ['Pod ready', 'Model has loaded and passed readiness', 'Service includes the Pod as a backend', 'Readiness should mean the model can accept real requests.'],
        ['Still loading', 'Large weights are still loading', 'Keep the Pod out of normal traffic', 'Watch startup time and reserve enough memory/GPU.'],
        ['Pod fails', 'One model copy exits', 'Controller can replace it; other ready copies may serve', 'Monitor restarts and keep capacity for failure or rollout.']
      ]
    },
    {
      name: 'CLUSTERS', title: 'Connect clusters only for a reason',
      copy: 'Multiple clusters can separate regions or operating boundaries. They do not discover or trust each other automatically, and most first deployments do not need them.',
      route: [['01 · SOURCE', 'Model cluster', 'Runs the inference service.'], ['02 · ROUTE', 'Private network', 'Provides an explicit path between clusters.'], ['03 · AUTHORIZE', 'Gateway + identity', 'Checks destination and calling service.'], ['04 · TARGET', 'Data cluster', 'Returns only the permitted response.']],
      notes: {
        managed: 'A hosted endpoint may abstract its cluster. Add a second cluster only for a concrete region, isolation, or ownership need.',
        container: 'Cross-cluster links add routing, identity, and network policy to operate. A single cluster is simpler when it meets the need.'
      },
      cases: [
        ['Route works', 'Model calls the remote service', 'Authorized response returns', 'Monitor cross-network latency and failures.'],
        ['No identity', 'Caller has no approved identity', 'Reject the call', 'Grant access narrowly; encrypt traffic in transit.'],
        ['Route down', 'Private network path is unavailable', 'Call fails or times out', 'Alert on dependency failures and define fallback behavior.']
      ]
    },
    {
      name: 'INTERNET', title: 'Expose one controlled public endpoint',
      copy: 'A user app resolves a service name and sends HTTPS traffic to a public edge. The edge forwards approved requests to your model API.',
      route: [['01 · CLIENT', 'User + app', 'Submits a photo for a prediction.'], ['02 · FIND', 'DNS + HTTPS', 'Resolves the endpoint name and protects the connection.'], ['03 · PROTECT', 'Gateway / endpoint', 'Applies authentication and traffic limits.'], ['04 · SERVE', 'Model API', 'Runs inference and returns the result.']],
      notes: {
        managed: 'The provider can supply the endpoint address; you still control who can call it, request limits, and monitoring.',
        container: 'You operate DNS, TLS, edge routing, authentication, and the service behind it. Keep the model Pods private.'
      },
      cases: [
        ['Authorized', 'Valid caller + supported photo', 'Prediction returns over HTTPS', 'Track response time, errors, availability, and model quality.'],
        ['No auth', 'Request has no valid credentials', 'Reject before inference', 'Do not expose an unrestricted prediction endpoint.'],
        ['Timeout', 'Endpoint cannot answer in time', 'Caller gets a timeout/error', 'Trace the path: edge, queue, model load, and dependency latency.']
      ]
    }
  ];
  let level = 0;
  let pointerStart = null;
  let lastDetailTarget = null;
  let launchMode = 'managed';
  let launchCaseIndex = 0;

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
    stage.removeAttribute('data-detail-type');
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
    const diagram = diagrams[key];
    if (!detail || !diagram) return;
    closeDetail();
    lastDetailTarget = target;
    target?.setAttribute('aria-pressed', 'true');
    stage.dataset.detail = key;
    stage.dataset.detailType = diagram.type;
    stage.setAttribute('aria-label', `${detail.title}. Press Escape or choose Back to stage to return.`);
    root.dataset.detailOpen = 'true';
    detailBack.hidden = false;
    detailFields.heading.textContent = detail.title.toUpperCase();
    detailFields.subheading.textContent = diagram.subtitle;
    detailFields.railTag.textContent = diagram.rail;
    const noteSplit = diagram.note.lastIndexOf(' ', 112);
    detailFields.note.textContent = noteSplit > 0 ? diagram.note.slice(0, noteSplit) : diagram.note;
    detailFields.noteMore.textContent = noteSplit > 0 ? diagram.note.slice(noteSplit + 1) : '';
    detailFields.cards.forEach((card, index) => {
      const [tag, label, lineA, lineB] = diagram.nodes[index];
      card.querySelector('[data-detail-tag]').textContent = tag;
      card.querySelector('[data-detail-label]').textContent = label;
      card.querySelector('[data-detail-copy-a]').textContent = lineA;
      card.querySelector('[data-detail-copy-b]').textContent = lineB;
      const focused = Array.isArray(diagram.focus) ? diagram.focus.includes(index) : index === diagram.focus;
      card.querySelector('.detail-node').classList.toggle('detail-node-focus', focused);
    });
    detailFields.linkLabels.forEach((label, index) => {
      label.textContent = diagram.links[index];
    });
    title.textContent = detail.title;
    copy.textContent = detail.copy;
    useCaseText.textContent = detail.use;
    useCase.hidden = false;
    stepLabel.textContent = `0${level + 1} / 0${steps.length} · DETAIL`;
    syncSceneAccess();
    stage.focus();
  };

  const setLaunchCase = (index) => {
    const scenario = launchStages[level].cases[index];
    if (!scenario) return;
    launchCaseIndex = index;
    launchGuide.querySelectorAll('[data-launch-case-index]').forEach((button) => {
      const buttonIndex = Number(button.dataset.launchCaseIndex);
      button.textContent = launchStages[level].cases[buttonIndex].label;
      button.setAttribute('aria-pressed', String(buttonIndex === index));
    });
    launchGuide.querySelector('[data-launch-case-switch]').setAttribute('aria-label', `Choose a scenario for the ${launchStages[level].name.toLowerCase()} stage`);
    launchGuide.querySelector('[data-launch-case-heading]').textContent = `TRY · ${launchStages[level].name}`;
    launchGuide.querySelector('[data-launch-request]').textContent = scenario.request;
    launchGuide.querySelector('[data-launch-result]').textContent = scenario.result;
    launchGuide.querySelector('[data-launch-signal]').textContent = scenario.signal;
  };

  const renderLaunchGuide = () => {
    const config = launchStages[level];
    const route = config.routes?.[launchMode] || config.route;
    launchGuide.dataset.launchStage = String(level);
    launchGuide.dataset.launchMode = launchMode;
    launchGuide.querySelector('[data-launch-stage-label]').textContent = `STAGE 0${level + 1} / 06 · ${config.name}`;
    launchGuide.querySelector('[data-launch-stage-title]').textContent = config.title;
    launchGuide.querySelector('[data-launch-stage-copy]').textContent = config.copy;
    launchGuide.querySelectorAll('[data-launch-mode]').forEach((button) => {
      button.setAttribute('aria-pressed', String(button.dataset.launchMode === launchMode));
    });
    launchGuide.querySelectorAll('[data-launch-step-title]').forEach((field, index) => {
      const [tag, title, copy, variant] = route[index];
      const card = field.closest('[data-launch-route-step]');
      card.querySelector('[data-launch-step-tag]').textContent = tag;
      field.textContent = title;
      card.querySelector('[data-launch-step-copy]').textContent = copy;
      card.dataset.launchStepVariant = variant || 'primary';
    });
    launchGuide.querySelector('[data-launch-mode-note]').textContent = config.notes[launchMode];
    setLaunchCase(Math.min(launchCaseIndex, config.cases.length - 1));
  };

  const setLaunchMode = (mode) => {
    if (!['managed', 'container'].includes(mode)) return;
    launchMode = mode;
    renderLaunchGuide();
  };

  const setLevel = (next) => {
    closeDetail();
    level = Math.max(0, Math.min(steps.length - 1, next));
    stage.dataset.level = String(level);
    range.value = String(level);
    title.textContent = steps[level].title;
    copy.textContent = steps[level].copy;
    launchCaseIndex = 0;
    stepLabel.textContent = `0${level + 1} / 0${steps.length}`;
    range.setAttribute('aria-valuetext', `Stage ${level + 1} of ${steps.length}: ${tabs[level].textContent.trim()}`);
    tabs.forEach((tab, index) => tab.setAttribute('aria-pressed', String(index === level)));
    renderLaunchGuide();
    syncSceneAccess();
  };

  root.querySelector('[data-zoom-in]').addEventListener('click', () => setLevel(level - 1));
  root.querySelector('[data-zoom-out]').addEventListener('click', () => setLevel(level + 1));
  root.querySelector('[data-zoom-reset]').addEventListener('click', () => setLevel(0));
  detailBack.addEventListener('click', () => closeDetail(true));
  range.addEventListener('input', () => setLevel(Number(range.value)));
  launchGuide.addEventListener('click', (event) => {
    const modeButton = event.target.closest('[data-launch-mode]');
    const caseButton = event.target.closest('[data-launch-case-index]');
    if (modeButton && launchGuide.contains(modeButton)) setLaunchMode(modeButton.dataset.launchMode);
    if (caseButton && launchGuide.contains(caseButton)) setLaunchCase(Number(caseButton.dataset.launchCaseIndex));
  });

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
    if (Math.abs(event.deltaY) < 5 || event.target.closest('button, input')) return;
    const next = level + (event.deltaY > 0 ? 1 : -1);
    if (next < 0 || next >= steps.length) return;
    event.preventDefault();
    setLevel(next);
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
