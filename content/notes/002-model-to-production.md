---
title: From model to production
slug: model-to-production
date: 2026-11-21
type: Articles
category: Articles
format: article
contributors: shankaranarayan|Author
tags: AI engineering, Data engineering, MLOps
shareImage: assets/research/explainable-ai.png
status: published
readTime: 4 min interactive
number: 002
home: true
excerpt: Follow a model outward—from its first container to connected services, Kubernetes clusters, and the internet. Six stages, one new complexity at a time.
---

# From model to production

## Explanation

You trained a model. Now someone needs to call it reliably. Start with the model in one container, then zoom out one step at a time to see the communication, scaling, orchestration, and networking around it. This is a map of choices, not a required stack: many first launches use a managed model endpoint and never need Kafka, Kubernetes, or multiple clusters.

{{production-zoom}}

### What data engineering adds

Data engineering makes the model's inputs dependable: it collects and transforms data, checks its schema and quality, tracks where it came from, and makes the right features available for training and prediction. Training and serving must agree on feature definitions and preprocessing; otherwise a model can receive different inputs in production than it saw during development.

Kafka or a Pub/Sub service can carry events between producers and consumers. A direct model request usually uses an API. Airflow can schedule batch workflows; Flyte can orchestrate data and ML workflows. Those tools coordinate jobs around the service; they are not extra containers every model needs in its live request path. Docker packages the app and dependencies. Kubernetes can run and scale its containers.

### A sensible first production release

1. **Choose how predictions happen.** Use an online API when a caller needs an immediate answer; use batch scoring when predictions can be prepared on a schedule.
2. **Define and validate the input contract.** Specify fields, types, missing-value behavior, preprocessing, and freshness. Check that training and serving produce compatible features.
3. **Version the release.** Keep the model artifact, inference code, preprocessing, dependencies, and configuration traceable together. The model can be bundled in the image or loaded from a model store.
4. **Release in stages.** Test with production-shaped inputs and expected resource needs, then send limited traffic to the new version. Protect the endpoint with authentication and rate limits; keep secrets out of the image. Keep a known-good version and a rollback procedure.
5. **Monitor and respond.** Track latency, errors, availability, missing or shifted inputs, and prediction quality. Outcomes may arrive late; monitor proxy signals carefully and compare them with labeled outcomes when available. Investigate before triggering a retrain.

Kubernetes is one way to orchestrate containers; it is not a requirement for every model. Cluster-to-cluster communication needs explicit network routing, identity, and security. The internet connects networks and public services; it is not made up of Kubernetes clusters.

### What to learn next

Start with **data contracts and validation**, then **batch vs. online serving** and **training-serving skew**. Next learn **model and data versioning**, **API security**, **container images**, and **safe release/rollback**. Add **workflow orchestration** for repeatable data or training jobs, and **monitoring** for service health and model behavior. Learn Kubernetes when you need to manage your own container workloads; it is one deployment option, not the first prerequisite.

## Visuals

Use the controls, scroll, or arrow keys to zoom outward from one model container through connected containers, service replicas, a local Kubernetes cluster, multiple clusters, and an internet-reachable service. Click any box to open a focused diagram and a practical use case below it. The stages add one new idea at a time.

## References

- [Kubernetes Deployments manage sets of Pods and support scaling and controlled rollouts](https://kubernetes.io/docs/concepts/workloads/controllers/deployment/)
- [Kubernetes Services provide a stable endpoint for changing groups of Pods](https://kubernetes.io/docs/concepts/services-networking/service/)
- [Kubernetes Gateway API and Ingress expose services to clients outside a cluster](https://kubernetes.io/docs/concepts/services-networking/)
- [Apache Kafka is an event streaming platform](https://kafka.apache.org/intro/)
- [Google Cloud Pub/Sub decouples event publishers from subscribers](https://docs.cloud.google.com/pubsub/docs/overview)
- [Apache Airflow orchestrates batch workflows](https://airflow.apache.org/docs/apache-airflow/stable/index.html)
- [Flyte orchestrates data and machine learning workflows](https://docs-flyte-legacy.union.ai/en/v1.13.0/introduction.html)
- [Docker images package applications and their dependencies](https://docs.docker.com/get-started/introduction/index.html)
- [Kubernetes cluster administration covers local, hosted, and multi-cluster setups](https://kubernetes.io/docs/concepts/cluster-administration/)
- [Google Cloud: MLOps pipelines, model delivery, and monitoring](https://cloud.google.com/architecture/mlops-continuous-delivery-and-automation-pipelines-in-machine-learning)
- [Google: Production ML logging, monitoring, and rollout guidance](https://developers.google.com/machine-learning/managing-ml-projects/production)
- [Google: Training-serving skew and feature consistency](https://developers.google.com/machine-learning/guides/rules-of-ml/)
- [MLflow Model Registry: model versioning, lineage, and aliases](https://www.mlflow.org/docs/latest/registry/)

## Related work

Start with [Explainable AI](xai-for-dummies.html) to explore how model behavior can be understood and evaluated.
