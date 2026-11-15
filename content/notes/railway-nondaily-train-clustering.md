---
title: Clustering Techniques to Optimize Railway Daily Path Utilization for Non-Daily Trains
slug: railway-nondaily-train-clustering
date: 2025-01-01
type: R&D
category: Research and Development
format: research
contributors: satwik|Co-author
tags: Railway optimization, Clustering, Timetabling
shareImage: assets/research/embodied-physical-ai.png
sourceUrl: https://doi.org/10.1016/j.trpro.2024.12.192
status: published
readTime: 5 min read
number: 004
home: false
excerpt: A clustering-based method groups weekly non-daily trains into representative daily paths to improve timetable utilization and expose available capacity.
---

## Problem

Non-daily passenger trains run on selected days of the week, making network timetabling and bottleneck-resource planning difficult. This study maps train times onto a daily cycle and uses clustering to group services that share railway resources at similar times on different days. A representative daily path can then stand in for a group of non-daily services during planning.

## Approach

The multi-institution author team includes Satwik V. Ramisetty. The work compares Hierarchical Agglomerative Clustering (HAC), DBSCAN, and K-means on six routes, considering conflict-free clustered trains and execution time.

## Findings

In the reported comparison, HAC produced more conflict-free clustered trains than K-means on four of six routes and ran substantially faster. On route 1, HAC grouped 208 trains without conflict in 2.15 seconds, compared with 198 in 312.70 seconds for K-means. K-means produced more conflict-free trains on route 2 (179 versus 178) and route 5 (78 versus 73). The study presents clustering as support for timetable planning and identifying potential under-utilized slots; it does not establish a network-wide realized service improvement.

## Citations and publications

- [Transportation Research Procedia article](https://doi.org/10.1016/j.trpro.2024.12.192)
- [WCTR 2023 paper PDF with comparative results](https://www.ee.iitb.ac.in/~belur/pdfs/c22wctr2-clustering.pdf)
- [IIT Bombay research summary](https://acr.iitbombay.org/allstory/how-researchers-are-optimising-indian-railways-without-touching-train-or-track/)
