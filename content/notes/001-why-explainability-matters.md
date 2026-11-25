---
title: Why explainability matters when AI acts
slug: why-explainability-matters
aliases: xai-for-dummies
date: 2026-11-13
type: Articles
category: Articles
format: article
contributors: shankaranarayan|Author
tags: Explainable AI, AI fundamentals, Responsible AI
status: published
readTime: 7 min · interactive examples
number: 001
home: true
heroLabel: Explainable AI · design-time choices and post-hoc checks
excerpt: Explore what explanations can tell us during training and after training—and where their evidence stops.
---

# Why explainability matters when AI acts

## Explanation

An image model labels a photo **cat**. Before a person relies on that output, they may ask what signals influenced it, whether the same pattern holds on other photos, or what change would flip the label. **Explainable AI (XAI)** is a family of methods for investigating those questions.

There is no single explanation that answers every question. A feature score, image highlight, or “what if?” answer is evidence about model behavior—not automatically the true cause of a prediction, proof that a model is correct, or proof that it is fair. The right explanation depends on who needs it and what decision they must make.

### Start with one prediction

Use the toy cat/dog model below. Pick an example, change its visible cues, compare a **single-case explanation** with the **whole model rule**, then ask the playground to find a small change that flips the label.

{{xai-playground}}

This is a deliberately small, additive rule. Its feature bars are calculated directly from the displayed formula; they are not SHAP or LIME output, and the toy does not analyze a real photograph. The rule deliberately gives “green grass” a misleading weight, so you can see how a shortcut can raise the cat score even when the animal cues do not support it.

### XAI can shape training—or inspect a finished model

Explainability is not only a picture added after a model is built. **During training**, a team can choose an interpretable structure, such as a concept bottleneck that predicts human-named attributes before the final label, or add explanation targets or constraints to the learning objective. This can make parts of the decision inspectable by design, but it may require concept labels and still needs evaluation.

**After training**, post-hoc methods probe a fixed model. Saliency and Grad-CAM trace sensitivity or class-related activation back to image regions; occlusion asks how the score changes when a region is hidden. These methods can be applied without retraining, but they do not expose every internal rule and can produce plausible-looking evidence that is incomplete or misleading.

{{xai-timing}}

## Visuals

This bundled example uses a ResNet50 ImageNet classifier. Its cat- and dog-target Grad-CAM overlays are precomputed outputs from the open-source `pytorch-grad-cam` project; this article does not run the model or show a prediction score. Choose “dog” and then “cat.” The same photo produces different maps because Grad-CAM explains a selected class.

{{xai-vision-explorer}}

The warmer region marks stronger response in that class-specific map; it is not a confidence value or proof that the highlighted pixels caused the prediction. Grad-CAM uses gradients from a chosen class score to weight feature maps from a convolutional layer. The official [Keras Grad-CAM example](https://keras.io/examples/vision/grad_cam/) shows the full computation on a pretrained Xception model.

### Four questions, four kinds of explanation

- **Local:** Which inputs moved this one prediction up or down? The playground’s case view answers this for one toy example.
- **Global:** What patterns or rules does the model use across its behavior? A global view summarizes broader behavior; it cannot be inferred from one example alone.
- **Counterfactual:** What is the smallest input change that would alter this output? The change must also be possible and meaningful in the real world.
- **Example based:** Which similar cases help a person understand the current result, and where do those examples differ?

These views answer different questions. A convincing local explanation does not establish how the model behaves for other people, images, or conditions.

### How common methods work

**Feature attribution** assigns contribution scores to inputs. [SHAP](https://proceedings.neurips.cc/paper_files/paper/2017/hash/8a20a8621978632d76c43dfd28b67767-Abstract.html) uses Shapley-value ideas to allocate a prediction among features. **LIME** perturbs an example and fits a simpler model near it, aiming to approximate behavior around that particular case. **Integrated Gradients** attributes a neural network’s output to input features along a path from a chosen baseline to the example.

For images, attribution can be shown as a heatmap over pixels or regions. A bright area means the selected method assigns it importance under its assumptions; it is not a photograph of the model’s reasoning. Different methods, baselines, or perturbations can produce different views. Choose the method that fits the question and model, then test whether it actually reflects model behavior. [Grad-CAM](https://openaccess.thecvf.com/content_iccv_2017/html/Selvaraju_Grad-CAM_Visual_Explanations_ICCV_2017_paper.html) uses gradients flowing into a convolutional layer to create a class-related localization map. The photo above shows precomputed maps; it does not calculate a new map for an arbitrary input.

### An explanation can be persuasive and still mislead

The playground’s rule uses grass as a shortcut: it raises “cat” even though grass does not determine the animal. Real models can learn similar correlations—for example, an object may co-occur with a background, watermark, camera, or hospital workflow. An explanation may help uncover that pattern, but the explanation itself needs checking.

Before relying on an explanation, ask:

- **Does it depend on the model?** If model parameters or labels are randomized, does the explanation change in a way that reflects the altered model?
- **Is it stable enough?** Do small, irrelevant changes leave the important parts mostly consistent?
- **Does the proposed change make sense?** A model-feature change may be impossible, unsafe, or outside the data the model learned from.
- **Who is it for?** A debugging view for an engineer is not automatically a useful explanation for an operator or a person affected by the decision.

Research on saliency maps shows why a visually appealing heatmap alone is not adequate validation. [Sanity checks for saliency maps](https://proceedings.neurips.cc/paper/2018/hash/294a8ed24b1ad22ec2e7efea049b8737-Abstract.html) compare explanations against changes to model parameters and training labels. No one check proves an explanation is faithful, but testing is stronger than trusting visual polish.

### Explanations support oversight; they do not replace it

For consequential decisions, evaluate accuracy, uncertainty, robustness, privacy, and bias as well as explanation quality. NIST includes explainability and interpretability among AI trustworthiness characteristics, alongside validity, safety, fairness, and accountability. Design an explanation for a real audience and action: say what it summarizes, where it may fail, and how a person can question or override the result.

### A practical XAI checklist

1. **Name the audience and question.** Are you debugging one output, comparing behavior across a dataset, or helping someone decide what to do?
2. **Select a method for the model and input.** A pixel attribution method does not answer the same question as a feature contribution or a counterfactual.
3. **Validate the explanation.** Check model dependence, sensitivity to reasonable perturbations, and consistency with known domain evidence.
4. **Check the limits.** Explanations are not causal claims, confidence estimates, fairness certificates, or substitutes for model evaluation.
5. **Connect it to human action.** Make uncertainty and recourse clear; decide who can review, override, or stop the system.

Explainability is not about making AI tell a convincing story. It is about producing useful, testable evidence that helps people understand model behavior and decide how much to rely on it.

## References

- [NIST AI Risk Management Framework: explainable and interpretable AI](https://airc.nist.gov/airmf-resources/airmf/3-sec-characteristics/)
- [A Unified Approach to Interpreting Model Predictions (SHAP)](https://proceedings.neurips.cc/paper_files/paper/2017/hash/8a20a8621978632d76c43dfd28b67767-Abstract.html)
- [“Why Should I Trust You?”: Explaining the Predictions of Any Classifier (LIME)](https://doi.org/10.1145/2939672.2939778)
- [Axiomatic Attribution for Deep Networks (Integrated Gradients)](https://proceedings.mlr.press/v70/sundararajan17a.html)
- [Sanity Checks for Saliency Maps](https://proceedings.neurips.cc/paper/2018/hash/294a8ed24b1ad22ec2e7efea049b8737-Abstract.html)
- [Concept Bottleneck Models](https://proceedings.mlr.press/v119/koh20a.html)
- [Visualizing and Understanding Convolutional Networks (Zeiler and Fergus)](https://arxiv.org/abs/1311.2901)
- [Keras: Grad-CAM class activation visualization](https://keras.io/examples/vision/grad_cam/)
- [PyTorch Grad-CAM: ResNet50 cat/dog example outputs](https://github.com/jacobgil/pytorch-grad-cam/tree/master/examples)
- [Grad-CAM: Visual Explanations From Deep Networks via Gradient-Based Localization](https://openaccess.thecvf.com/content_iccv_2017/html/Selvaraju_Grad-CAM_Visual_Explanations_ICCV_2017_paper.html)

## Related work

For the next step from model behavior to serving it for real users, read [How AI models reach production](model-to-production.html).
