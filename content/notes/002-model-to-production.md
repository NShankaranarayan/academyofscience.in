---
title: How AI models reach production
slug: model-to-production
date: 2026-11-21
type: Articles
category: Articles
format: article
contributors: shankaranarayan|Author
tags: AI engineering, Data engineering, MLOps
shareImage: assets/research/explainable-ai.png
status: published
readTime: 6 min + interactive
heroLabel: The only data engineering article on this site
number: 002
home: true
excerpt: A practical visual and text guide to the data, services, and infrastructure that take an AI model from notebook to real users.
---

# How AI models reach production

## Explanation

You trained a model. Now someone needs to call it reliably. Follow one example: a photo app sends an image and gets back `cat, 0.98`. Zoom out to see the communication, scaling, orchestration, and networking around that prediction. This is a map of choices, not a required stack: many first launches use a managed model endpoint and never need Kafka, Kubernetes, or multiple clusters.

**Data engineering supplies dependable data and pipelines; ML and platform engineering often package, deploy, connect, and scale the serving system.** Teams share these responsibilities differently, but a model reaches users only when the data path and serving path work together.

{{production-zoom}}

Prefer text to diagrams? The walkthrough below covers the same journey. Each stage adds a problem to solve; you do not need every tool named here to launch a first model.

### The six stages, in plain language

1. **Put the model in an app.** A trained weights file is not yet a service. An inference app loads it, accepts a photo, applies the same resizing and normalization used in training, runs prediction, and returns a label and score. Package the app and its libraries into a [Docker image](https://docs.docker.com/get-started/introduction/); when that image runs, it is a container. The app should also say whether it is ready to receive requests, and return a useful error for a bad image.
2. **Connect the pieces the product needs.** For an immediate answer, the photo app calls the model API and waits. A database can store results or provide current context when the product needs it. If work can happen later, the app can publish an event for a worker—for example, to make a thumbnail. This asynchronous path frees the caller sooner, but needs clear retry and duplicate-processing behavior. Kafka is an event-streaming platform with retained topic logs; Pub/Sub is a managed messaging service with topics and subscriptions. They solve related problems but have different operating and delivery models. [Airflow](https://airflow.apache.org/docs/apache-airflow/stable/index.html) and [Flyte](https://www.union.ai/docs/v2/flyte/user-guide/get-started/) belong on a separate path: they coordinate repeatable data, evaluation, or training jobs, not each live prediction.
3. **Run copies to handle more callers.** One app process can only handle so much work. Run several copies of the same service and send requests to a healthy copy. This is horizontal scaling: it helps handle more requests at once, but does not make one prediction itself faster. More copies cost more, and model weights may take time or GPU memory to load. Track request rate, latency, errors, and capacity so scaling responds to a real bottleneck.
4. **Let one Kubernetes cluster manage those copies.** A cluster is an environment of one or more machines (nodes) where Kubernetes schedules workloads. It can run on your laptop for learning or be hosted elsewhere. When you operate containers yourself, [Kubernetes](https://kubernetes.io/docs/concepts/workloads/controllers/deployment/) keeps the requested number of app copies running and can replace failed ones. A Kubernetes Service gives callers a stable in-cluster address, while readiness checks keep a model that is still loading out of normal traffic. A managed endpoint can handle this layer for a first release.
5. **Connect separate clusters only when there is a reason.** A team might use separate clusters for different regions, environments, or security boundaries. Services then need deliberate routing, identity, and access rules between them. A second cluster is extra operational work; it is not an automatic step in scaling. First ask whether one cluster or a managed service can meet the latency, availability, and data-location needs.
6. **Make the service reachable and safe to use.** To serve real users, a public or private network route leads to the service. DNS maps a familiar domain name to the endpoint; HTTPS encrypts the connection. An API gateway or load balancer can route traffic and enforce authentication and limits. The World Wide Web is the sites and services people access over the internet; the internet itself connects networks. Before launch, decide who can call the endpoint, what inputs it accepts, what happens when it is overloaded, and how to roll back a bad model release.

### How data engineering connects to serving

Data engineering prepares, checks, transforms, and tracks the data used to train and serve a model. Training and serving must agree on feature meanings and preprocessing; otherwise familiar inputs may behave differently in production. After launch, logs and labeled outcomes help teams spot broken inputs, changing data, or declining quality. A [model registry](https://www.mlflow.org/docs/latest/registry/) can track model versions and lineage. The exact split of this work between data, ML, and platform teams varies by organization.

Think of production as two linked paths:

- **Serve a prediction:** photo → API → preprocessing → model → label. The app waits for this response.
- **Prepare data and releases:** collect and validate data → train and evaluate → version the model → deploy it. This creates the version the API serves.

### A sensible first production release

1. **Choose how predictions happen.** Use an online API when a caller needs an immediate answer; use batch scoring when predictions can be prepared on a schedule.
2. **Define and validate the input contract.** Specify fields, types, allowed formats and sizes, missing-value behavior, preprocessing, and freshness. Check that training and serving produce compatible features.
3. **Version the release.** Keep the model artifact, inference code, preprocessing, dependencies, and configuration traceable together. The model can be bundled in the image or loaded from a model store.
4. **Release in stages.** Test with realistic inputs and expected resources, then send limited traffic to the new version. Set replica limits and allow for model startup time. Protect the endpoint with authentication and rate limits; keep secrets out of the image. Keep a known-good version and a rollback procedure.
5. **Monitor and respond.** Track latency, errors, availability, missing or shifted inputs, and prediction quality. Outcomes may arrive late; monitor proxy signals carefully and compare them with labeled outcomes when available. Investigate before triggering a retrain.

For a cat/dog model, start with one image endpoint, clear image limits, known preprocessing, a health check, latency and error monitoring, and a way to restore the previous model. Add a database, queue, scheduler, GPUs, or Kubernetes only when a product need justifies the extra moving parts.

### What to learn next

Start with Google's [production ML guidance](https://developers.google.com/machine-learning/managing-ml-projects/production), focusing on data quality, training-serving consistency, safe releases, and monitoring. Then learn to package an app with the [Docker introduction](https://docs.docker.com/get-started/introduction/). If you operate your own containers, study Kubernetes [Deployments](https://kubernetes.io/docs/concepts/workloads/controllers/deployment/) and [Services](https://kubernetes.io/docs/concepts/services-networking/service/). Read the [Kafka](https://kafka.apache.org/intro/) and [Pub/Sub](https://docs.cloud.google.com/pubsub/docs/overview) guides when you need asynchronous messaging; explore [Airflow](https://airflow.apache.org/docs/apache-airflow/stable/index.html) or [Flyte](https://www.union.ai/docs/v2/flyte/user-guide/get-started/) when you need repeatable workflows. Treat these as optional next steps, not a software checklist.

## Visuals

Use the controls, scroll, or arrow keys to move from one model container through connected services, replicas, one Kubernetes cluster, multiple clusters, and an internet-reachable service. Click a box for its detail and use case. The first-release guide follows the selected stage; compare hosted and self-managed paths and try a scenario. Open **Tool notes** for concise definitions and guidance on when each tool helps.

## References

- [Google: Production ML project guidance](https://developers.google.com/machine-learning/managing-ml-projects/production)
- [Google: Training-serving skew and feature consistency](https://developers.google.com/machine-learning/guides/rules-of-ml/)
- [Kubernetes: readiness probes](https://kubernetes.io/docs/concepts/workloads/pods/probes/)
- [Kubernetes: horizontal pod autoscaling](https://kubernetes.io/docs/concepts/workloads/autoscaling/horizontal-pod-autoscale/)
- [Google Cloud: MLOps pipelines, delivery, and monitoring](https://cloud.google.com/architecture/mlops-continuous-delivery-and-automation-pipelines-in-machine-learning)
- [MLflow Model Registry: versioning and lineage](https://www.mlflow.org/docs/latest/registry/)

## Related work

Start with [Explainable AI](xai-for-dummies.html) to explore how model behavior can be understood and evaluated.
