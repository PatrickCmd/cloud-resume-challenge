## Context

The MLOps Zoomcamp capstone: take a working notebook that predicts bike-share trip duration from [Capital Bikeshare](https://ride.capitalbikeshare.com/system-data) data and turn it into something that retrains, tracks, promotes and serves a model without a human running cells by hand.

## Architecture

- **Training:** a scikit-learn pipeline (feature imputation plus ridge, random forest and gradient boosting candidates) parameterised by month of data.
- **Experiment tracking:** MLflow with a SQLite backend store and S3 as the artifact store, so every run keeps its metrics, parameters and model files.
- **Model registry:** a staging flow registers the best run and moves it to the Staging stage.
- **Orchestration:** Prefect deployments on work queues for training and staging, run on a schedule by agents.
- **Serving:** a Flask web service in Docker that loads the staged model from the registry and answers prediction requests.

## Decisions

- **Registry as the contract.** The web service never reads a model file path; it asks the registry for the current staged version, which lets a scheduled flow promote a model without redeploying the service.
- **S3 for artifacts from day one.** Local-only artifact stores make the registry useless on a second machine, so artifacts went to a bucket even while everything else ran locally.
- **Separate queues for training and staging.** They have different cadences and failure modes; keeping them apart kept a failed training run from blocking a promotion.

## Results

- Reproducible training runs with tracked metrics and a promotable registry.
- Scheduled, agent-run flows instead of manual notebook execution.
- A containerised prediction service that follows the registry's Staging alias.
- Source: [github.com/PatrickCmd/mlops-project](https://github.com/PatrickCmd/mlops-project). Planned next steps were Terraform-managed infrastructure and batch or streaming inference on Lambda and Kinesis.
