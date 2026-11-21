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

You trained a model. Now someone needs to call it reliably. Start with the model in one container, then zoom out one step at a time to see the communication, scaling, orchestration, and networking around it.

{{production-zoom}}

### What data engineering adds

Production needs inputs that are prepared, versioned, validated, and available in the shape the model expects. The serving path returns predictions; data pipelines and monitoring help teams detect changed inputs, quality issues, and model drift, then decide whether to retrain or roll back.

Kafka or a Pub/Sub service can carry events between producers and consumers. A direct model request usually uses an API. Airflow can schedule batch workflows; Flyte can orchestrate data and ML workflows. Those tools coordinate work around the service; they are not extra containers every model needs in its live request path. Docker packages the app and dependencies. Kubernetes can run and scale its containers.

### A useful mental model

Package the inference code and runtime. Include the model artifact in the image or load it from a model store. Run one or more copies behind a stable service. Expose that service through a controlled network entry point. Add monitoring, versioning, and a way to release or roll back safely.

Kubernetes is one way to orchestrate containers; it is not a requirement for every model. Cluster-to-cluster communication needs explicit network routing, identity, and security. The internet connects networks and public services; it is not made up of Kubernetes clusters.

## Visuals

Use the controls, scroll, drag, or arrow keys to zoom outward from one model container through connected containers, service replicas, a local Kubernetes cluster, multiple clusters, and an internet-reachable service. The stages add one new idea at a time.

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

## Related work

Start with [Explainable AI](xai-for-dummies.html) to explore how model behavior can be understood and evaluated.
