/**
 * CKAD bundle seed — vendor, three practice-exam variants, bundle,
 * and 60 blueprint-aligned questions. Idempotent: replaces rows
 * tagged `generatedBy: 'manual:ckad-seed'` and upserts catalog rows.
 *
 * Exported as `seedCkad(db)` so the same code path is reachable from
 * the standalone CLI shim (`prisma/seeds/ckad.ts`) and the protected
 * admin API (`/api/admin/seed-ckad`) — letting us bootstrap the
 * production database without redeploying.
 *
 * Question content is authored against the public ckad-prep-master
 * labs and the CNCF CKAD v1.35 blueprint:
 *   - Application Design and Build                       — 20% (4)
 *   - Application Deployment                             — 20% (4)
 *   - Application Observability and Maintenance          — 15% (3)
 *   - Application Environment, Configuration and Security— 25% (5)
 *   - Services and Networking                            — 20% (4)
 */
import { PrismaClient, QStatus, QType } from '@prisma/client';

type Opt = { id: string; text: string };
type Q = {
  domain: string;
  difficulty: number;
  type: QType;
  stem: string;
  options: Opt[];
  correct: string[];
  explanation: string;
  references: { label: string; url: string }[];
  isTeaser?: boolean;
};

const DESIGN = 'Application Design and Build';
const DEPLOY = 'Application Deployment';
const OBSERV = 'Application Observability and Maintenance';
const CONFIG = 'Application Environment, Configuration and Security';
const NET = 'Services and Networking';

const REF_PODS = { label: 'Kubernetes Docs — Pods', url: 'https://kubernetes.io/docs/concepts/workloads/pods/' };
const REF_DEPLOY = { label: 'Kubernetes Docs — Deployments', url: 'https://kubernetes.io/docs/concepts/workloads/controllers/deployment/' };
const REF_JOBS = { label: 'Kubernetes Docs — Jobs', url: 'https://kubernetes.io/docs/concepts/workloads/controllers/job/' };
const REF_CRON = { label: 'Kubernetes Docs — CronJobs', url: 'https://kubernetes.io/docs/concepts/workloads/controllers/cron-jobs/' };
const REF_INIT = { label: 'Kubernetes Docs — Init Containers', url: 'https://kubernetes.io/docs/concepts/workloads/pods/init-containers/' };
const REF_MULTI = { label: 'Kubernetes Docs — Pod Design Patterns', url: 'https://kubernetes.io/docs/concepts/workloads/pods/#workload-resources-for-managing-pods' };
const REF_PROBES = { label: 'Kubernetes Docs — Liveness/Readiness/Startup Probes', url: 'https://kubernetes.io/docs/tasks/configure-pod-container/configure-liveness-readiness-startup-probes/' };
const REF_LOGS = { label: 'Kubernetes Docs — Logging Architecture', url: 'https://kubernetes.io/docs/concepts/cluster-administration/logging/' };
const REF_CM = { label: 'Kubernetes Docs — ConfigMaps', url: 'https://kubernetes.io/docs/concepts/configuration/configmap/' };
const REF_SEC = { label: 'Kubernetes Docs — Secrets', url: 'https://kubernetes.io/docs/concepts/configuration/secret/' };
const REF_SCTX = { label: 'Kubernetes Docs — SecurityContext', url: 'https://kubernetes.io/docs/tasks/configure-pod-container/security-context/' };
const REF_SA = { label: 'Kubernetes Docs — ServiceAccounts', url: 'https://kubernetes.io/docs/tasks/configure-pod-container/configure-service-account/' };
const REF_RES = { label: 'Kubernetes Docs — Resource Management', url: 'https://kubernetes.io/docs/concepts/configuration/manage-resources-containers/' };
const REF_PV = { label: 'Kubernetes Docs — Persistent Volumes', url: 'https://kubernetes.io/docs/concepts/storage/persistent-volumes/' };
const REF_SVC = { label: 'Kubernetes Docs — Services', url: 'https://kubernetes.io/docs/concepts/services-networking/service/' };
const REF_ING = { label: 'Kubernetes Docs — Ingress', url: 'https://kubernetes.io/docs/concepts/services-networking/ingress/' };
const REF_NP = { label: 'Kubernetes Docs — Network Policies', url: 'https://kubernetes.io/docs/concepts/services-networking/network-policies/' };
const REF_HELM = { label: 'Helm Docs — Charts', url: 'https://helm.sh/docs/topics/charts/' };

// Helper to build 4-option SINGLE questions with id 'a','b','c','d'.
const opts4 = (a: string, b: string, c: string, d: string): Opt[] => [
  { id: 'a', text: a }, { id: 'b', text: b }, { id: 'c', text: c }, { id: 'd', text: d }
];

// ───────────────────── Practice Exam 1 ─────────────────────
const P1: Q[] = [
  // ── Design and Build (4) ──
  {
    domain: DESIGN, difficulty: 2, type: QType.SINGLE, isTeaser: true,
    stem: 'Which `kubectl` command imperatively creates a Pod named `mypod` running the `nginx:1.25` image and exposes container port 80, without creating a Deployment?',
    options: opts4(
      'kubectl create pod mypod --image=nginx:1.25 --port=80',
      'kubectl run mypod --image=nginx:1.25 --restart=Never --port=80',
      'kubectl apply pod mypod --image=nginx:1.25 --port=80',
      'kubectl deploy mypod --image=nginx:1.25 --port=80'
    ),
    correct: ['b'],
    explanation: '`kubectl run` with `--restart=Never` creates a bare Pod (not a Deployment or Job). `--port` records the containerPort. `kubectl create pod` is not a valid subcommand, and `kubectl apply` requires a manifest.',
    references: [REF_PODS]
  },
  {
    domain: DESIGN, difficulty: 3, type: QType.SINGLE, isTeaser: true,
    stem: 'A Pod must run a one-off database migration to completion before the main application container starts and serves traffic. Which Pod construct is the correct fit?',
    options: opts4(
      'A sidecar container in the same Pod',
      'An initContainer that runs the migration',
      'A separate Deployment running the migration script',
      'A liveness probe that triggers the migration'
    ),
    correct: ['b'],
    explanation: 'Init containers run to completion sequentially before any app containers start. Sidecars run alongside app containers (not before), and probes do not run workloads.',
    references: [REF_INIT]
  },
  {
    domain: DESIGN, difficulty: 3, type: QType.MULTI,
    stem: 'You need a workload that runs to completion on a schedule every night at 02:00. Select ALL true statements about Kubernetes CronJobs.',
    options: opts4(
      'CronJob.spec.schedule uses standard cron syntax (e.g. "0 2 * * *").',
      'A CronJob creates a Job object for each scheduled run.',
      'CronJobs run forever; like Deployments they restart Pods on completion.',
      'spec.concurrencyPolicy can be Allow, Forbid, or Replace.'
    ),
    correct: ['a', 'b', 'd'],
    explanation: 'CronJobs spawn a Job per schedule fire. Jobs run to completion — CronJobs do NOT restart finished Pods like Deployments. `concurrencyPolicy` controls overlapping runs.',
    references: [REF_CRON, REF_JOBS]
  },
  {
    domain: DESIGN, difficulty: 4, type: QType.SINGLE,
    stem: 'You build a container image and the running container exits immediately. The Dockerfile ends with `CMD ["./app"]` but a `kubectl logs` shows "exec: ./app: not found". The most likely cause is:',
    options: opts4(
      'The image uses a scratch base and the binary is dynamically linked against glibc that is not present.',
      'The Pod has no readiness probe configured.',
      'The Service selector does not match the Pod labels.',
      'A NetworkPolicy is blocking the container from starting.'
    ),
    correct: ['a'],
    explanation: 'A dynamically linked binary placed in a scratch image fails to exec because the dynamic loader/glibc is absent. Probes, Services, and NetworkPolicies are unrelated to container startup exec failures.',
    references: [REF_PODS]
  },

  // ── Deployment (4) ──
  {
    domain: DEPLOY, difficulty: 2, type: QType.SINGLE, isTeaser: true,
    stem: 'You need to update the image of Deployment `web` to `nginx:1.27` while preserving rollout history. Which command does this idiomatically?',
    options: opts4(
      'kubectl edit deployment web (and save the file)',
      'kubectl set image deployment/web nginx=nginx:1.27',
      'kubectl replace deployment/web --image=nginx:1.27',
      'kubectl patch pod web --image=nginx:1.27'
    ),
    correct: ['b'],
    explanation: '`kubectl set image` is the canonical, recorded way to update a container image on a Deployment and triggers a rolling update with a revision recorded in the rollout history.',
    references: [REF_DEPLOY]
  },
  {
    domain: DEPLOY, difficulty: 3, type: QType.SINGLE,
    stem: 'A bad image was rolled out to Deployment `api`. Which command rolls back to the previous revision?',
    options: opts4(
      'kubectl undo deployment api',
      'kubectl rollout undo deployment/api',
      'kubectl rollback deployment api --to-revision=previous',
      'kubectl rollout revert deployment/api'
    ),
    correct: ['b'],
    explanation: '`kubectl rollout undo deployment/<name>` reverts to the prior revision. Use `--to-revision=N` to target a specific one.',
    references: [REF_DEPLOY]
  },
  {
    domain: DEPLOY, difficulty: 3, type: QType.SINGLE,
    stem: 'In a Deployment\'s RollingUpdate strategy, `maxSurge: 25%` and `maxUnavailable: 0` for a 4-replica Deployment means:',
    options: opts4(
      'At most 1 extra Pod above 4 may exist during rollout; never fewer than 4 ready.',
      'Up to 25% of Pods may be unavailable at any time.',
      'Pods are upgraded one at a time, terminating the old first.',
      'The Deployment is paused until all Pods are ready.'
    ),
    correct: ['a'],
    explanation: '`maxSurge` is how many Pods above desired may be created during rollout. `maxUnavailable: 0` means the ready count never drops below desired — useful for zero-downtime updates.',
    references: [REF_DEPLOY]
  },
  {
    domain: DEPLOY, difficulty: 3, type: QType.SINGLE,
    stem: 'Which tool packages Kubernetes manifests as versioned, templatable units called "charts" with values overrides?',
    options: opts4(
      'Kustomize',
      'Helm',
      'Skaffold',
      'kubectl apply -k'
    ),
    correct: ['b'],
    explanation: 'Helm uses charts and a `values.yaml` template system. Kustomize composes overlays from base manifests without templating.',
    references: [REF_HELM]
  },

  // ── Observability and Maintenance (3) ──
  {
    domain: OBSERV, difficulty: 2, type: QType.SINGLE, isTeaser: true,
    stem: 'Your app boots in 45 seconds before its `/healthz` endpoint becomes responsive. The kubelet keeps killing the Pod with "Liveness probe failed". The MOST appropriate fix is:',
    options: opts4(
      'Remove the liveness probe entirely.',
      'Add a startupProbe so the liveness probe is suppressed until the container has finished starting.',
      'Replace the liveness probe with a readiness probe.',
      'Increase the Pod\'s memory limit.'
    ),
    correct: ['b'],
    explanation: 'startupProbe lets slow-starting containers boot without being killed by liveness. Replacing liveness with readiness leaves the Pod running but never marked ready, hurting traffic. Removing liveness entirely is not recommended for long-lived processes.',
    references: [REF_PROBES]
  },
  {
    domain: OBSERV, difficulty: 3, type: QType.SINGLE,
    stem: 'Pod `web-7d8` is in a `CrashLoopBackOff`. Which sequence is the BEST first-step diagnosis?',
    options: opts4(
      'kubectl delete pod web-7d8 and let it be recreated.',
      'kubectl logs web-7d8 --previous; kubectl describe pod web-7d8',
      'kubectl exec -it web-7d8 -- /bin/sh',
      'kubectl scale deployment web --replicas=0 then back up.'
    ),
    correct: ['b'],
    explanation: '`logs --previous` shows stdout of the crashed container before restart; `describe` shows Events and exit codes. Exec only works on a running container.',
    references: [REF_LOGS]
  },
  {
    domain: OBSERV, difficulty: 4, type: QType.MULTI,
    stem: 'Select ALL true statements about probes in Kubernetes.',
    options: opts4(
      'A failing readinessProbe removes the Pod\'s IP from Service endpoints but does NOT restart the container.',
      'A failing livenessProbe causes the kubelet to restart the container.',
      'A startupProbe runs continuously throughout the Pod\'s lifetime.',
      'Probes can be httpGet, exec, tcpSocket, or grpc actions.'
    ),
    correct: ['a', 'b', 'd'],
    explanation: 'startupProbe runs ONLY during startup, then liveness/readiness take over. Readiness gates traffic without restart; liveness triggers restart. Probe actions are httpGet/exec/tcpSocket/grpc.',
    references: [REF_PROBES]
  },

  // ── Environment, Configuration and Security (5) ──
  {
    domain: CONFIG, difficulty: 2, type: QType.SINGLE, isTeaser: true,
    stem: 'Which command creates a ConfigMap named `app-config` containing a single key `LOG_LEVEL=debug` imperatively?',
    options: opts4(
      'kubectl create configmap app-config --from-literal=LOG_LEVEL=debug',
      'kubectl set configmap app-config LOG_LEVEL=debug',
      'kubectl run configmap app-config --env=LOG_LEVEL=debug',
      'kubectl apply configmap app-config --data=LOG_LEVEL=debug'
    ),
    correct: ['a'],
    explanation: '`--from-literal=KEY=VALUE` is the standard way to inject literal key/value pairs into a ConfigMap. `--from-file=` loads file contents instead.',
    references: [REF_CM]
  },
  {
    domain: CONFIG, difficulty: 3, type: QType.SINGLE,
    stem: 'You need a Pod that runs as a NON-root user with UID 1000 and rejects privilege escalation. Which `securityContext` fragment achieves this?',
    options: opts4(
      'spec.securityContext: { runAsUser: 1000, allowPrivilegeEscalation: false }',
      'spec.securityContext: { runAsUser: 1000 } and spec.containers[].securityContext: { allowPrivilegeEscalation: false }',
      'spec.containers[].env: { USER: "1000", PRIV_ESCAL: "false" }',
      'spec.serviceAccountName: non-root'
    ),
    correct: ['b'],
    explanation: '`runAsUser` is valid at Pod or container level. `allowPrivilegeEscalation` is a CONTAINER-level field only and must be set in the container\'s securityContext.',
    references: [REF_SCTX]
  },
  {
    domain: CONFIG, difficulty: 3, type: QType.SINGLE,
    stem: 'How are Secret values stored in etcd by default in a managed Kubernetes cluster with default settings?',
    options: opts4(
      'AES-256 encrypted at rest with a customer-managed key.',
      'Base64-encoded (NOT encrypted) unless an EncryptionConfiguration is configured.',
      'Hashed with bcrypt.',
      'Stored only on the kubelet node, never in etcd.'
    ),
    correct: ['b'],
    explanation: 'By default, Kubernetes Secrets are base64-encoded in etcd — encoding, NOT encryption. Encryption-at-rest requires `EncryptionConfiguration` on the API server.',
    references: [REF_SEC]
  },
  {
    domain: CONFIG, difficulty: 3, type: QType.SINGLE,
    stem: 'A Pod needs to call the Kubernetes API to list Pods in its namespace. Which is the correct approach?',
    options: opts4(
      'Hard-code an admin kubeconfig as a Secret in the Pod.',
      'Create a ServiceAccount with a Role granting `get,list pods`, bind it via RoleBinding, and set `spec.serviceAccountName` on the Pod.',
      'Set `spec.privileged: true` on the container.',
      'Disable RBAC for the namespace.'
    ),
    correct: ['b'],
    explanation: 'The correct pattern is a dedicated ServiceAccount bound to a least-privilege Role via a RoleBinding. The Pod uses that SA via `spec.serviceAccountName`.',
    references: [REF_SA]
  },
  {
    domain: CONFIG, difficulty: 4, type: QType.SINGLE,
    stem: 'A container requests 100m CPU and limits 500m CPU. The node has free capacity. During traffic spikes the container is throttled at ~500m even though there is idle CPU. Why?',
    options: opts4(
      'The request, not the limit, caps usage.',
      'The CPU LIMIT enforces a hard cap via CFS quota — usage above 500m is throttled regardless of node capacity.',
      'The kubelet evicts the Pod above 500m CPU.',
      'Throttling occurs only when memory pressure exists.'
    ),
    correct: ['b'],
    explanation: 'CPU `limits` are enforced as hard CFS quotas — a container is throttled at the limit even when the node is idle. `requests` only affect scheduling.',
    references: [REF_RES]
  },

  // ── Services and Networking (4) ──
  {
    domain: NET, difficulty: 2, type: QType.SINGLE, isTeaser: true,
    stem: 'Which Service type exposes a Pod set on a stable cluster-internal IP only?',
    options: opts4(
      'NodePort',
      'LoadBalancer',
      'ClusterIP',
      'ExternalName'
    ),
    correct: ['c'],
    explanation: 'ClusterIP (the default) is internal-only. NodePort opens a port on every node; LoadBalancer provisions an external LB; ExternalName is a DNS alias.',
    references: [REF_SVC]
  },
  {
    domain: NET, difficulty: 3, type: QType.SINGLE,
    stem: 'A Service `db.production` is reached from a Pod in the `production` namespace via which fully qualified DNS name?',
    options: opts4(
      'db',
      'db.svc.production',
      'db.production.svc.cluster.local',
      'production.db.cluster.local'
    ),
    correct: ['c'],
    explanation: 'Service DNS is `<svc>.<ns>.svc.cluster.local`. Within the same namespace `db` alone resolves; the FQDN is `db.production.svc.cluster.local`.',
    references: [REF_SVC]
  },
  {
    domain: NET, difficulty: 4, type: QType.MULTI,
    stem: 'About Kubernetes NetworkPolicies, select ALL true statements.',
    options: opts4(
      'A NetworkPolicy needs a CNI plugin that implements policy enforcement (e.g. Calico, Cilium) to take effect.',
      'In a namespace with NO NetworkPolicy, all Pod-to-Pod traffic is allowed by default.',
      'A NetworkPolicy selecting Pods with no `ingress` rules denies ALL ingress to those Pods.',
      'NetworkPolicies can filter by destination port AND by source Pod labels.'
    ),
    correct: ['a', 'b', 'c', 'd'],
    explanation: 'All four are true. The default cluster posture is allow-all until a NetworkPolicy targets a Pod; once targeted, traffic must match an explicit allow rule.',
    references: [REF_NP]
  },
  {
    domain: NET, difficulty: 3, type: QType.SINGLE,
    stem: 'You need to expose HTTP path `/api/*` of Service `api` and `/web/*` of Service `web` on the same external hostname. The correct resource is:',
    options: opts4(
      'Two LoadBalancer Services on the same external IP',
      'An Ingress with two path rules pointing to the two Services',
      'A NodePort Service with multiple ports',
      'A NetworkPolicy with two egress rules'
    ),
    correct: ['b'],
    explanation: 'Ingress provides HTTP host- and path-based routing to multiple backend Services through a single ingress controller.',
    references: [REF_ING]
  }
];

// ───────────────────── Practice Exam 2 ─────────────────────
const P2: Q[] = [
  // ── Design and Build (4) ──
  {
    domain: DESIGN, difficulty: 3, type: QType.SINGLE,
    stem: 'A Pod has one main container plus a small companion container that ships its stdout logs to an external aggregator. This is which multi-container pattern?',
    options: opts4(
      'Init container',
      'Sidecar',
      'Ambassador',
      'Adapter'
    ),
    correct: ['b'],
    explanation: 'A sidecar augments the main container (logging, metrics, sync) sharing the same Pod\'s lifecycle and volumes. Ambassador proxies network calls; adapter normalizes output for external consumption.',
    references: [REF_MULTI]
  },
  {
    domain: DESIGN, difficulty: 3, type: QType.SINGLE,
    stem: 'You want a Job that runs 5 Pods in parallel until 10 successful completions are reached. Which Job fields achieve this?',
    options: opts4(
      'completions: 10, parallelism: 5',
      'replicas: 10, parallelism: 5',
      'completions: 5, parallelism: 10',
      'backoffLimit: 10, parallelism: 5'
    ),
    correct: ['a'],
    explanation: '`completions` is total successes needed; `parallelism` caps concurrent Pods. `backoffLimit` only governs retry attempts on failure.',
    references: [REF_JOBS]
  },
  {
    domain: DESIGN, difficulty: 4, type: QType.SINGLE,
    stem: 'A CronJob has `concurrencyPolicy: Forbid` and `startingDeadlineSeconds: 30`. The previous run is still active when the next schedule fires 30s late. What happens to that fire?',
    options: opts4(
      'A second Job is started in parallel.',
      'The fire is skipped because the previous run is active AND the deadline has passed.',
      'The previous Job is killed and replaced.',
      'The CronJob is suspended automatically.'
    ),
    correct: ['b'],
    explanation: '`Forbid` prevents concurrency, and missing the startingDeadline marks the fire as missed/skipped (recorded in status).',
    references: [REF_CRON]
  },
  {
    domain: DESIGN, difficulty: 3, type: QType.SINGLE,
    stem: 'In a Dockerfile, which instruction sets the working directory for subsequent RUN/CMD/ENTRYPOINT and is preferred over `RUN cd /app`?',
    options: opts4(
      'CHDIR /app',
      'WORKDIR /app',
      'PWD /app',
      'CD /app'
    ),
    correct: ['b'],
    explanation: '`WORKDIR` is the only Dockerfile instruction that persists the working directory across layers. `RUN cd` only affects the single layer.',
    references: [REF_PODS]
  },

  // ── Deployment (4) ──
  {
    domain: DEPLOY, difficulty: 2, type: QType.SINGLE,
    stem: 'Which command scales Deployment `api` to 6 replicas?',
    options: opts4(
      'kubectl scale deployment/api --replicas=6',
      'kubectl resize deployment api 6',
      'kubectl set replicas deployment/api 6',
      'kubectl deploy api --scale=6'
    ),
    correct: ['a'],
    explanation: '`kubectl scale` is the canonical command for adjusting replicas on Deployments, ReplicaSets, ReplicationControllers, and StatefulSets.',
    references: [REF_DEPLOY]
  },
  {
    domain: DEPLOY, difficulty: 3, type: QType.SINGLE,
    stem: 'You apply a Deployment with `strategy.type: Recreate`. What is the practical effect during an update?',
    options: opts4(
      'New Pods are gradually scaled up while old ones scale down.',
      'All old Pods are terminated FIRST; then new Pods are created — service downtime is expected.',
      'Only one Pod is updated at a time.',
      'The rollout is paused until manual approval.'
    ),
    correct: ['b'],
    explanation: 'Recreate fully drains the old Pods before launching the new ones. It is appropriate for workloads incompatible with running two versions simultaneously (e.g. some PVC-bound singletons).',
    references: [REF_DEPLOY]
  },
  {
    domain: DEPLOY, difficulty: 3, type: QType.SINGLE,
    stem: 'A canary release strategy on Kubernetes typically:',
    options: opts4(
      'Replaces all Pods with the new version at once.',
      'Routes a small share of traffic to a small subset of new-version Pods, expanding as confidence grows.',
      'Requires the kube-apiserver to be restarted.',
      'Is only possible with a service mesh.'
    ),
    correct: ['b'],
    explanation: 'Canary = gradual exposure of the new version to a subset of users. Achievable natively via two Deployments behind one Service or with finer-grained traffic split via Ingress/Service mesh.',
    references: [REF_DEPLOY]
  },
  {
    domain: DEPLOY, difficulty: 3, type: QType.SINGLE,
    stem: 'Kustomize\'s primary value proposition relative to Helm is:',
    options: opts4(
      'Built-in template language with conditionals and loops.',
      'Pure-YAML overlays that patch a common "base" — no templating language needed.',
      'A chart registry for versioned releases.',
      'It replaces kubectl entirely.'
    ),
    correct: ['b'],
    explanation: 'Kustomize composes overlays over a base via strategic-merge or JSON patches — there is no template language. Helm offers templating + a chart registry; the two tools are complementary.',
    references: [REF_DEPLOY]
  },

  // ── Observability and Maintenance (3) ──
  {
    domain: OBSERV, difficulty: 2, type: QType.SINGLE,
    stem: 'Which command tails (streams) logs of all Pods of Deployment `web`?',
    options: opts4(
      'kubectl logs -f -l app=web',
      'kubectl tail deployment/web',
      'kubectl logs deployment/web --stream',
      'kubectl stream deployment web'
    ),
    correct: ['a'],
    explanation: '`-l` filters by label and `-f` follows logs. `kubectl logs deployment/web -f` works too but only streams from one Pod selected by the controller.',
    references: [REF_LOGS]
  },
  {
    domain: OBSERV, difficulty: 4, type: QType.SINGLE,
    stem: 'An exec liveness probe `cat /tmp/healthy` runs every 10s with failureThreshold 3. The file disappears at t=0. Approximately when will the kubelet restart the container?',
    options: opts4(
      'Immediately at t=0',
      'Around t=10s (1 failure)',
      'Around t=30s (3 consecutive failures × 10s period)',
      'Never — exec probes do not trigger restarts'
    ),
    correct: ['c'],
    explanation: 'Liveness probes mark a container failed only after `failureThreshold` consecutive failures. With period 10s × 3 failures ≈ 30s before restart.',
    references: [REF_PROBES]
  },
  {
    domain: OBSERV, difficulty: 3, type: QType.SINGLE,
    stem: 'Which command shows recent cluster events, ordered by timestamp, namespace-scoped?',
    options: opts4(
      'kubectl get events --sort-by=.lastTimestamp',
      'kubectl describe events',
      'kubectl event log',
      'kubectl logs events'
    ),
    correct: ['a'],
    explanation: '`kubectl get events --sort-by=.lastTimestamp` is the standard debugging recipe. `describe pod` also surfaces the events for a specific Pod.',
    references: [REF_LOGS]
  },

  // ── Environment, Configuration and Security (5) ──
  {
    domain: CONFIG, difficulty: 3, type: QType.SINGLE,
    stem: 'You mount a ConfigMap `app-cfg` as a volume at `/etc/app`. The ConfigMap is then updated with `kubectl apply`. What does the running Pod see?',
    options: opts4(
      'The file in /etc/app is updated automatically after the kubelet sync (eventually consistent; typically within ~1 minute).',
      'The Pod is restarted automatically on the next sync.',
      'Nothing changes until the Pod is manually deleted/recreated.',
      'The Pod immediately enters CrashLoopBackOff.'
    ),
    correct: ['a'],
    explanation: 'ConfigMaps and Secrets mounted as volumes propagate updates to the in-Pod filesystem on the next kubelet sync (period configurable, default ~60s). Env-var injections, by contrast, are baked in at Pod start.',
    references: [REF_CM]
  },
  {
    domain: CONFIG, difficulty: 2, type: QType.SINGLE,
    stem: 'A Secret of type `kubernetes.io/dockerconfigjson` is referenced by a Pod via `spec.imagePullSecrets`. Its purpose is:',
    options: opts4(
      'Encrypting traffic between Pods.',
      'Providing credentials to pull images from a private registry.',
      'Encrypting volumes at rest.',
      'Authenticating the Pod to the API server.'
    ),
    correct: ['b'],
    explanation: '`dockerconfigjson` secrets carry registry credentials; referenced via `imagePullSecrets`, they let the kubelet pull from private registries.',
    references: [REF_SEC]
  },
  {
    domain: CONFIG, difficulty: 3, type: QType.SINGLE,
    stem: 'A namespace has a `ResourceQuota` of `requests.cpu: 1` and `limits.cpu: 2`. You apply a Pod requesting 600m CPU and limiting 1500m. The cluster has free capacity. What happens?',
    options: opts4(
      'The Pod is accepted because the cluster has free CPU.',
      'The Pod is REJECTED at admission because limits.cpu (1500m) added to existing usage may exceed 2 (depends on existing usage); but the request also pushes near the 1 CPU ceiling — admission rejects when the quota is exceeded.',
      'The Pod is accepted but throttled to 100m.',
      'The kubelet evicts an existing Pod to make room.'
    ),
    correct: ['b'],
    explanation: 'ResourceQuotas are enforced at admission. New Pods are rejected if their request/limit pushes the namespace totals above the quota.',
    references: [REF_RES]
  },
  {
    domain: CONFIG, difficulty: 4, type: QType.SINGLE,
    stem: 'A Pod with no resource requests is scheduled. Then memory pressure builds on the node and the kubelet must evict Pods. Which Pod is evicted FIRST under standard QoS rules?',
    options: opts4(
      'Guaranteed Pods (requests == limits)',
      'Burstable Pods (requests < limits)',
      'BestEffort Pods (no requests or limits)',
      'Pods marked critical via priorityClass'
    ),
    correct: ['c'],
    explanation: 'Eviction order under node pressure is BestEffort → Burstable → Guaranteed. BestEffort Pods (no requests/limits) are sacrificed first.',
    references: [REF_RES]
  },
  {
    domain: CONFIG, difficulty: 3, type: QType.SINGLE,
    stem: 'A PersistentVolumeClaim with `accessModes: [ReadWriteOnce]` can be:',
    options: opts4(
      'Mounted read-write by exactly one node at a time.',
      'Mounted read-write by every Pod in the namespace concurrently.',
      'Mounted read-only by many nodes but not read-write.',
      'Mounted read-write only by Pods in the same Pod.'
    ),
    correct: ['a'],
    explanation: 'RWO permits read-write by ONE node (not Pod). Multiple Pods on that same node can mount it. RWX permits multi-node read-write.',
    references: [REF_PV]
  },

  // ── Services and Networking (4) ──
  {
    domain: NET, difficulty: 3, type: QType.SINGLE,
    stem: 'A Service `api` of type ClusterIP selects Pods with label `app=api`. You scale the Deployment up by 2 Pods. What must you do for the new Pods to receive traffic?',
    options: opts4(
      'Update the Service\'s `targetPort` to the new Pod count.',
      'Nothing — the EndpointSlice controller updates endpoints automatically as Pods become Ready.',
      'Delete and recreate the Service.',
      'Restart kube-proxy on every node.'
    ),
    correct: ['b'],
    explanation: 'The EndpointSlice / Endpoints controller continuously reconciles Service backends to match Ready Pods of the selector. No manual action is needed.',
    references: [REF_SVC]
  },
  {
    domain: NET, difficulty: 3, type: QType.SINGLE,
    stem: 'A NetworkPolicy in namespace `prod` has `podSelector: {}` and `policyTypes: [Ingress]` with no `ingress` rules. The effect is:',
    options: opts4(
      'Allow all ingress to all Pods in prod.',
      'Deny all ingress to all Pods in prod.',
      'Deny all egress from all Pods in prod.',
      'No effect (empty policy is ignored).'
    ),
    correct: ['b'],
    explanation: 'An empty `podSelector: {}` matches every Pod in the namespace; declaring `policyTypes: [Ingress]` with no `ingress` rules denies all ingress to those Pods.',
    references: [REF_NP]
  },
  {
    domain: NET, difficulty: 4, type: QType.SINGLE,
    stem: 'A NodePort Service has `spec.ports[0].nodePort: 31000`. From OUTSIDE the cluster, the Service is reachable via:',
    options: opts4(
      'http://<any-node-ip>:31000',
      'http://<service-cluster-ip>:31000',
      'http://<pod-ip>:31000',
      'http://<kube-apiserver>:31000'
    ),
    correct: ['a'],
    explanation: 'NodePort opens the same port on every node. Reach the Service at any node\'s IP on that port; kube-proxy forwards into the cluster.',
    references: [REF_SVC]
  },
  {
    domain: NET, difficulty: 3, type: QType.SINGLE,
    stem: 'You need a stable DNS-based alias for the external hostname `db.example.com` inside the cluster. Which Service type fits?',
    options: opts4(
      'ClusterIP',
      'NodePort',
      'LoadBalancer',
      'ExternalName'
    ),
    correct: ['d'],
    explanation: 'ExternalName Services return a CNAME to an external host in cluster DNS — no proxying, no IP allocation.',
    references: [REF_SVC]
  }
];

// ───────────────────── Practice Exam 3 ─────────────────────
const P3: Q[] = [
  // ── Design and Build (4) ──
  {
    domain: DESIGN, difficulty: 3, type: QType.SINGLE,
    stem: 'Which Docker layer is rebuilt FIRST when only the application source code (added last in the Dockerfile) changes?',
    options: opts4(
      'The base image FROM layer.',
      'The layer added immediately after the changed source line, and everything below.',
      'The COPY/ADD layer containing the changed source and every layer AFTER it.',
      'The entire image is rebuilt from scratch every time.'
    ),
    correct: ['c'],
    explanation: 'Docker cache is invalidated at the first changed layer and every subsequent layer. Placing rarely-changing instructions early (e.g. dependency install) maximises cache reuse.',
    references: [REF_PODS]
  },
  {
    domain: DESIGN, difficulty: 3, type: QType.SINGLE,
    stem: 'Two containers in one Pod need to share a directory. Which volume type is appropriate?',
    options: opts4(
      'emptyDir',
      'hostPath',
      'persistentVolumeClaim',
      'configMap'
    ),
    correct: ['a'],
    explanation: '`emptyDir` is created when the Pod is assigned to a node and shared among the Pod\'s containers. It is removed when the Pod terminates. hostPath ties to a specific node; PVC is typically for cross-Pod persistence.',
    references: [REF_PV]
  },
  {
    domain: DESIGN, difficulty: 4, type: QType.MULTI,
    stem: 'Select ALL true statements about init containers.',
    options: opts4(
      'Init containers run to completion BEFORE app containers start.',
      'Init containers can have their own resource requests/limits and securityContext.',
      'Init containers run in parallel with app containers.',
      'If an init container fails, the Pod is restarted (by default).'
    ),
    correct: ['a', 'b', 'd'],
    explanation: 'Init containers run sequentially before app containers — not in parallel. They have their own resources/securityContext. Default restartPolicy is Always, so an init failure triggers Pod restart.',
    references: [REF_INIT]
  },
  {
    domain: DESIGN, difficulty: 3, type: QType.SINGLE,
    stem: 'A Job has `backoffLimit: 4`. What does this mean?',
    options: opts4(
      'The Job retries up to 4 times before being marked failed.',
      'The Job runs at most 4 Pods in parallel.',
      'The Job times out after 4 minutes.',
      'The Job retains 4 completed Pods after success.'
    ),
    correct: ['a'],
    explanation: '`backoffLimit` caps the number of retries on failure. After that many attempts, the Job reports Failed status.',
    references: [REF_JOBS]
  },

  // ── Deployment (4) ──
  {
    domain: DEPLOY, difficulty: 3, type: QType.SINGLE,
    stem: 'Which command pauses an in-progress rollout of Deployment `api`?',
    options: opts4(
      'kubectl rollout pause deployment/api',
      'kubectl rollout halt deployment/api',
      'kubectl scale deployment/api --pause',
      'kubectl deploy api --pause'
    ),
    correct: ['a'],
    explanation: '`kubectl rollout pause/resume deployment/<name>` pauses and resumes a rollout. Useful for canary-style staged updates.',
    references: [REF_DEPLOY]
  },
  {
    domain: DEPLOY, difficulty: 2, type: QType.SINGLE,
    stem: 'Which kubectl subcommand creates resources from a manifest in a declarative, idempotent way?',
    options: opts4(
      'kubectl create -f manifest.yaml',
      'kubectl apply -f manifest.yaml',
      'kubectl run -f manifest.yaml',
      'kubectl replace -f manifest.yaml'
    ),
    correct: ['b'],
    explanation: '`kubectl apply` is the declarative command — it creates resources that do not exist and patches existing ones based on the manifest, tracking changes via the last-applied annotation.',
    references: [REF_DEPLOY]
  },
  {
    domain: DEPLOY, difficulty: 4, type: QType.SINGLE,
    stem: 'A Deployment\'s revisionHistoryLimit defaults to 10. What does it control?',
    options: opts4(
      'Maximum simultaneous rolling Pods.',
      'Maximum number of OLD ReplicaSets retained for rollback.',
      'Maximum age in days before a ReplicaSet is pruned.',
      'Maximum number of replicas.'
    ),
    correct: ['b'],
    explanation: '`revisionHistoryLimit` keeps the last N old ReplicaSets so `kubectl rollout undo --to-revision=N` can target them. Older ones are garbage-collected.',
    references: [REF_DEPLOY]
  },
  {
    domain: DEPLOY, difficulty: 3, type: QType.SINGLE,
    stem: 'A blue/green deployment strategy on Kubernetes is typically implemented by:',
    options: opts4(
      'Running two Deployments (blue, green) behind one Service, switching the Service selector between them at cutover.',
      'Using `strategy.type: Recreate` on a single Deployment.',
      'Setting `maxUnavailable: 50%`.',
      'Disabling the readiness probe during cutover.'
    ),
    correct: ['a'],
    explanation: 'Blue/green keeps two complete environments and flips the selector (or Ingress backend) atomically. Recreate is single-Deployment downtime updates, not blue/green.',
    references: [REF_DEPLOY]
  },

  // ── Observability and Maintenance (3) ──
  {
    domain: OBSERV, difficulty: 3, type: QType.SINGLE,
    stem: 'A Pod has two containers `app` and `proxy`. How do you retrieve only the `app` container\'s logs?',
    options: opts4(
      'kubectl logs <pod> --container=app',
      'kubectl logs <pod>/app',
      'kubectl logs --filter=app <pod>',
      'kubectl exec <pod> -- logs app'
    ),
    correct: ['a'],
    explanation: 'Use `-c`/`--container` to disambiguate containers when a Pod has more than one.',
    references: [REF_LOGS]
  },
  {
    domain: OBSERV, difficulty: 4, type: QType.SINGLE,
    stem: 'You add a readinessProbe to a fronting Pod. During slow startup the Pod reports Ready=False. What is the user-visible effect?',
    options: opts4(
      'The Pod is killed and restarted by the kubelet.',
      'The Pod\'s IP is REMOVED from any backing Service\'s endpoints, so traffic is not routed to it.',
      'The Pod is moved to another node.',
      'The Deployment fails the rollout immediately.'
    ),
    correct: ['b'],
    explanation: 'Readiness gates Service endpoint membership but does NOT restart Pods. A rollout pauses if too few Pods become Ready (per maxUnavailable).',
    references: [REF_PROBES]
  },
  {
    domain: OBSERV, difficulty: 3, type: QType.SINGLE,
    stem: 'Which command prints CPU and memory usage of every Pod in the current namespace (requires metrics-server)?',
    options: opts4(
      'kubectl top pods',
      'kubectl get pods --metrics',
      'kubectl resources pods',
      'kubectl describe metrics'
    ),
    correct: ['a'],
    explanation: '`kubectl top` reads from the Metrics API served by metrics-server (or equivalent). `kubectl top nodes` shows node-level metrics.',
    references: [REF_LOGS]
  },

  // ── Environment, Configuration and Security (5) ──
  {
    domain: CONFIG, difficulty: 2, type: QType.SINGLE,
    stem: 'Which command creates a generic Secret named `db-cred` with key `password=s3cret!`?',
    options: opts4(
      'kubectl create secret generic db-cred --from-literal=password=s3cret!',
      'kubectl create secret db-cred --password=s3cret!',
      'kubectl set secret db-cred password=s3cret!',
      'kubectl secret generic db-cred password=s3cret!'
    ),
    correct: ['a'],
    explanation: '`kubectl create secret generic ... --from-literal` is the imperative form. There are also `tls` and `docker-registry` subtypes.',
    references: [REF_SEC]
  },
  {
    domain: CONFIG, difficulty: 3, type: QType.SINGLE,
    stem: 'A container needs the entire ConfigMap `app-cfg` exposed as environment variables. Which spec snippet does this?',
    options: opts4(
      'envFrom: [{ configMapRef: { name: app-cfg } }]',
      'env: [{ valueFrom: { configMap: app-cfg } }]',
      'volumeMounts: [{ name: app-cfg, mountPath: /env }]',
      'configMap: app-cfg'
    ),
    correct: ['a'],
    explanation: '`envFrom.configMapRef` projects every key in the ConfigMap as an env var. `env[].valueFrom.configMapKeyRef` is for one key at a time.',
    references: [REF_CM]
  },
  {
    domain: CONFIG, difficulty: 4, type: QType.SINGLE,
    stem: 'A namespace has a `LimitRange` with default container CPU request 200m / limit 500m. You apply a Pod with NO resources specified. What happens?',
    options: opts4(
      'The Pod is rejected at admission.',
      'The Pod is created with request 200m / limit 500m applied by the LimitRange admission controller.',
      'The Pod runs with no requests/limits (LimitRange is advisory).',
      'The Pod runs but is marked Failed.'
    ),
    correct: ['b'],
    explanation: 'LimitRange admission injects the namespace defaults into Pods that omit them. It can also enforce min/max bounds, rejecting Pods that violate them.',
    references: [REF_RES]
  },
  {
    domain: CONFIG, difficulty: 3, type: QType.SINGLE,
    stem: 'You need a Pod to use a non-default ServiceAccount `ci-bot`. Which Pod spec field sets this?',
    options: opts4(
      'spec.serviceAccount: ci-bot',
      'spec.serviceAccountName: ci-bot',
      'spec.containers[].serviceAccount: ci-bot',
      'metadata.serviceAccount: ci-bot'
    ),
    correct: ['b'],
    explanation: '`spec.serviceAccountName` is the correct field. `spec.serviceAccount` is deprecated and `containers[].serviceAccount` does not exist.',
    references: [REF_SA]
  },
  {
    domain: CONFIG, difficulty: 4, type: QType.MULTI,
    stem: 'Select ALL true statements about PersistentVolumes and PersistentVolumeClaims.',
    options: opts4(
      'A PVC binds to one PV at a time; the binding is exclusive.',
      'StorageClasses enable dynamic provisioning — a matching PV is created on demand when the PVC is created.',
      'A PVC can be expanded online if the StorageClass has `allowVolumeExpansion: true`.',
      'Deleting a PVC always deletes the underlying PV regardless of reclaim policy.'
    ),
    correct: ['a', 'b', 'c'],
    explanation: 'PV reclaim policy controls deletion: `Delete` removes the PV; `Retain` keeps it. So deletion of a PVC does NOT always delete the PV — depends on policy.',
    references: [REF_PV]
  },

  // ── Services and Networking (4) ──
  {
    domain: NET, difficulty: 3, type: QType.SINGLE,
    stem: 'A Service `web` selects Pods with `app=web`. Two Pods have that label — one Ready, one NotReady. Endpoints for the Service contain:',
    options: opts4(
      'Both Pod IPs.',
      'Only the Ready Pod\'s IP; the NotReady Pod is in `notReadyAddresses`.',
      'Only the NotReady Pod\'s IP.',
      'No endpoints until both are Ready.'
    ),
    correct: ['b'],
    explanation: 'EndpointSlices place Ready Pods in `addresses` and not-Ready Pods in `notReadyAddresses`. Only Ready endpoints receive traffic.',
    references: [REF_SVC]
  },
  {
    domain: NET, difficulty: 3, type: QType.SINGLE,
    stem: 'Which Service field selects which Pods back the Service?',
    options: opts4(
      'spec.selector',
      'spec.podSelector',
      'spec.targetSelector',
      'metadata.labels'
    ),
    correct: ['a'],
    explanation: '`spec.selector` on a Service matches Pods by label and populates Endpoints. `podSelector` is a NetworkPolicy field; `metadata.labels` are the Service\'s own labels.',
    references: [REF_SVC]
  },
  {
    domain: NET, difficulty: 4, type: QType.SINGLE,
    stem: 'An Ingress routes `host: shop.example.com` to Service `shop:80`. TLS is enabled via `spec.tls[0].secretName: shop-tls`. The Secret type must be:',
    options: opts4(
      'Opaque',
      'kubernetes.io/tls',
      'kubernetes.io/dockerconfigjson',
      'bootstrap.kubernetes.io/token'
    ),
    correct: ['b'],
    explanation: 'Ingress TLS requires a `kubernetes.io/tls` Secret carrying `tls.crt` and `tls.key`.',
    references: [REF_ING, REF_SEC]
  },
  {
    domain: NET, difficulty: 3, type: QType.SINGLE,
    stem: 'A NetworkPolicy in namespace `prod` allows ingress from Pods labelled `role=frontend` in namespace `web`. Which selector pair is correct?',
    options: opts4(
      'ingress.from: [{ podSelector: { matchLabels: { role: frontend } } }]',
      'ingress.from: [{ namespaceSelector: { matchLabels: { kubernetes.io/metadata.name: web } }, podSelector: { matchLabels: { role: frontend } } }]',
      'ingress.from: [{ namespaceSelector: { matchLabels: { role: frontend } } }]',
      'ingress.from: [{ ipBlock: { cidr: 0.0.0.0/0 } }]'
    ),
    correct: ['b'],
    explanation: 'Cross-namespace selection requires BOTH a namespaceSelector (to match the source namespace) AND a podSelector (to match the source Pods). Option A would match only Pods in the same namespace.',
    references: [REF_NP]
  }
];

const CKAD_DOMAINS = [
  { name: DESIGN, weight: 20 },
  { name: DEPLOY, weight: 20 },
  { name: OBSERV, weight: 15 },
  { name: CONFIG, weight: 25 },
  { name: NET, weight: 20 }
];

const CKAD_EXAMS: { slug: string; code: string; titleSuffix: string; descriptionSuffix: string; questions: Q[] }[] = [
  {
    slug: 'linuxfoundation-ckad-p1',
    code: 'CKAD-P1',
    titleSuffix: 'Practice Exam 1',
    descriptionSuffix: 'Practice exam 1 of 3 — full 120-minute, 20-question, blueprint-weighted set covering Pods, Deployments, Jobs, ConfigMaps/Secrets, SecurityContexts, ServiceAccounts, probes, multi-container patterns, Services, NetworkPolicies, and Ingress.',
    questions: P1
  },
  {
    slug: 'linuxfoundation-ckad-p2',
    code: 'CKAD-P2',
    titleSuffix: 'Practice Exam 2',
    descriptionSuffix: 'Practice exam 2 of 3 — a second 120-minute, 20-question, blueprint-weighted set.',
    questions: P2
  },
  {
    slug: 'linuxfoundation-ckad-p3',
    code: 'CKAD-P3',
    titleSuffix: 'Practice Exam 3',
    descriptionSuffix: 'Practice exam 3 of 3 — a third 120-minute, 20-question, blueprint-weighted set.',
    questions: P3
  }
];

const CKAD_BUNDLE = {
  slug: 'linuxfoundation-ckad',
  title: 'Certified Kubernetes Application Developer (CKAD)',
  description: 'All 3 CKAD practice exams in one bundle — covering application design & build, deployment, observability & maintenance, environment/configuration/security, and services & networking, aligned to CNCF CKAD v1.35.',
  price: 2000, // USD 20 — PRACTICE tier
  priceVoucher: 39500 // USD 395 — VOUCHER tier (matches CKAD real-exam fee)
};

type SeedResult = {
  vendor: 'created' | 'updated';
  exams: { slug: string; questionCount: number; teaserCount: number }[];
  bundle: 'created' | 'updated';
};

/**
 * Idempotent seed for the CKAD bundle. Safe to call repeatedly — vendor /
 * exam / bundle rows are upserted, and questions tagged
 * `generatedBy: 'manual:ckad-seed'` are deleted and re-created.
 *
 * Pass an existing PrismaClient (lifecycle managed by caller).
 */
export async function seedCkad(db: PrismaClient): Promise<SeedResult> {
  const existingVendor = await db.vendor.findUnique({ where: { slug: 'linuxfoundation' } });
  await db.vendor.upsert({
    where: { slug: 'linuxfoundation' },
    update: { name: 'Linux Foundation', description: 'CNCF / Linux Foundation certifications — CKAD, CKA, CKS, and other open-source ecosystem credentials.' },
    create: { slug: 'linuxfoundation', name: 'Linux Foundation', description: 'CNCF / Linux Foundation certifications — CKAD, CKA, CKS, and other open-source ecosystem credentials.' }
  });
  const vendor = await db.vendor.findUniqueOrThrow({ where: { slug: 'linuxfoundation' } });

  const examResults: SeedResult['exams'] = [];
  const examIds: Record<string, string> = {};

  for (const e of CKAD_EXAMS) {
    const title = `Certified Kubernetes Application Developer (CKAD) — ${e.titleSuffix}`;
    const description = `${e.descriptionSuffix} Aligned to CNCF CKAD v1.35.`;
    const examData = {
      title,
      code: e.code,
      description,
      level: 'Associate',
      durationMinutes: 120,
      passingScore: 66,
      questionCount: e.questions.length,
      domains: CKAD_DOMAINS,
      published: true
    };
    const exam = await db.exam.upsert({
      where: { slug: e.slug },
      update: examData,
      create: { ...examData, slug: e.slug, vendorId: vendor.id }
    });
    examIds[e.slug] = exam.id;

    await db.question.deleteMany({ where: { examId: exam.id, generatedBy: 'manual:ckad-seed' } });
    let teaserCount = 0;
    for (const q of e.questions) {
      await db.question.create({
        data: {
          examId: exam.id,
          domain: q.domain,
          difficulty: q.difficulty,
          type: q.type,
          stem: q.stem,
          options: q.options,
          correct: q.correct,
          explanation: q.explanation,
          references: q.references,
          status: QStatus.PUBLISHED,
          generatedBy: 'manual:ckad-seed',
          isTeaser: !!q.isTeaser
        }
      });
      if (q.isTeaser) teaserCount++;
    }
    examResults.push({ slug: e.slug, questionCount: e.questions.length, teaserCount });
  }

  const existingBundle = await db.bundle.findUnique({ where: { slug: CKAD_BUNDLE.slug } });
  const bundle = await db.bundle.upsert({
    where: { slug: CKAD_BUNDLE.slug },
    update: {
      title: CKAD_BUNDLE.title,
      description: CKAD_BUNDLE.description,
      price: CKAD_BUNDLE.price,
      priceVoucher: CKAD_BUNDLE.priceVoucher,
      published: true
    },
    create: {
      slug: CKAD_BUNDLE.slug,
      title: CKAD_BUNDLE.title,
      description: CKAD_BUNDLE.description,
      price: CKAD_BUNDLE.price,
      priceVoucher: CKAD_BUNDLE.priceVoucher,
      published: true
    }
  });

  // Replace bundle items deterministically: drop existing, recreate.
  await db.bundleItem.deleteMany({ where: { bundleId: bundle.id } });
  const items = [
    { examSlug: 'linuxfoundation-ckad-p1', tier: 'PRACTICE' as const, position: 1 },
    { examSlug: 'linuxfoundation-ckad-p2', tier: 'PRACTICE' as const, position: 2 },
    { examSlug: 'linuxfoundation-ckad-p3', tier: 'PRACTICE' as const, position: 3 },
    { examSlug: 'linuxfoundation-ckad-p1', tier: 'VOUCHER' as const, position: 4 }
  ];
  for (const it of items) {
    await db.bundleItem.create({
      data: { bundleId: bundle.id, examId: examIds[it.examSlug], tier: it.tier, position: it.position }
    });
  }

  return {
    vendor: existingVendor ? 'updated' : 'created',
    exams: examResults,
    bundle: existingBundle ? 'updated' : 'created'
  };
}
