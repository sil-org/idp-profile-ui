FROM alpine:3.20

RUN apk add --no-cache bash aws-cli

WORKDIR /dynamo

ENV AWS_ENDPOINT=dynamo:8000
ENV AWS_DEFAULT_REGION=us-east-1
ENV AWS_ACCESS_KEY_ID=abc123
ENV AWS_SECRET_ACCESS_KEY=abc123
ENV AWS_DISABLE_SSL="true"

COPY ./ /dynamo
RUN chmod +x /dynamo/*.sh

CMD ["bash", "/dynamo/restart.sh"]
