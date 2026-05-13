/**
 * CKA bundle seed — vendor, three practice-exam variants, bundle, and 60
 * blueprint-aligned questions. Idempotent: replaces rows tagged
 * `generatedBy: 'manual:cka-seed'` and upserts catalog rows.
 *
 * Exported as `seedCka(db)` so the same code path is reachable from the
 * standalone CLI shim (`prisma/seeds/cka.ts`) and the protected admin API
 * (`/api/admin/seed-cka`) — letting us bootstrap the production database
 * without redeploying.
 *
 * Content references the public TGS-2025054612-CKA prep labs and the
 * CNCF CKA v1.32 blueprint:
 *   - Cluster Architecture, Installation and Configuration — 25% (5)
 *   - Workloads and Scheduling                             — 15% (3)
 *   - Services and Networking                              — 20% (4)
 *   - Storage                                              — 10% (2)
 *   - Troubleshooting                                      — 30% (6)
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

const CLUSTER = 'Cluster Architecture, Installation and Configuration';
const WORK = 'Workloads and Scheduling';
const NET = 'Services and Networking';
const STORE = 'Storage';
const TS = 'Troubleshooting';

const REF_KUBEADM = { label: 'Kubernetes Docs — kubeadm', url: 'https://kubernetes.io/docs/setup/production-environment/tools/kubeadm/' };
const REF_RBAC = { label: 'Kubernetes Docs — RBAC', url: 'https://kubernetes.io/docs/reference/access-authn-authz/rbac/' };
const REF_HELM = { label: 'Helm Docs — Charts', url: 'https://helm.sh/docs/topics/charts/' };
const REF_CRD = { label: 'Kubernetes Docs — Custom Resources', url: 'https://kubernetes.io/docs/concepts/extend-kubernetes/api-extension/custom-resources/' };
const REF_ETCD = { label: 'Kubernetes Docs — Operating etcd', url: 'https://kubernetes.io/docs/tasks/administer-cluster/configure-upgrade-etcd/' };
const REF_UPGRADE = { label: 'Kubernetes Docs — Upgrading kubeadm clusters', url: 'https://kubernetes.io/docs/tasks/administer-cluster/kubeadm/kubeadm-upgrade/' };
const REF_CNI = { label: 'Kubernetes Docs — Network Plugins (CNI)', url: 'https://kubernetes.io/docs/concepts/extend-kubernetes/compute-storage-net/network-plugins/' };
const REF_CRI = { label: 'Kubernetes Docs — Container Runtimes', url: 'https://kubernetes.io/docs/setup/production-environment/container-runtimes/' };
const REF_TAINT = { label: 'Kubernetes Docs — Taints and Tolerations', url: 'https://kubernetes.io/docs/concepts/scheduling-eviction/taint-and-toleration/' };
const REF_AFFIN = { label: 'Kubernetes Docs — Assigning Pods to Nodes', url: 'https://kubernetes.io/docs/concepts/scheduling-eviction/assign-pod-node/' };
const REF_DEPLOY = { label: 'Kubernetes Docs — Deployments', url: 'https://kubernetes.io/docs/concepts/workloads/controllers/deployment/' };
const REF_DS = { label: 'Kubernetes Docs — DaemonSet', url: 'https://kubernetes.io/docs/concepts/workloads/controllers/daemonset/' };
const REF_HPA = { label: 'Kubernetes Docs — Horizontal Pod Autoscaling', url: 'https://kubernetes.io/docs/tasks/run-application/horizontal-pod-autoscale/' };
const REF_PRIO = { label: 'Kubernetes Docs — Pod Priority and Preemption', url: 'https://kubernetes.io/docs/concepts/scheduling-eviction/pod-priority-preemption/' };
const REF_RES = { label: 'Kubernetes Docs — Resource Management', url: 'https://kubernetes.io/docs/concepts/configuration/manage-resources-containers/' };
const REF_SVC = { label: 'Kubernetes Docs — Services', url: 'https://kubernetes.io/docs/concepts/services-networking/service/' };
const REF_ING = { label: 'Kubernetes Docs — Ingress', url: 'https://kubernetes.io/docs/concepts/services-networking/ingress/' };
const REF_GW = { label: 'Kubernetes Docs — Gateway API', url: 'https://gateway-api.sigs.k8s.io/' };
const REF_NP = { label: 'Kubernetes Docs — Network Policies', url: 'https://kubernetes.io/docs/concepts/services-networking/network-policies/' };
const REF_DNS = { label: 'Kubernetes Docs — DNS for Services and Pods', url: 'https://kubernetes.io/docs/concepts/services-networking/dns-pod-service/' };
const REF_PV = { label: 'Kubernetes Docs — Persistent Volumes', url: 'https://kubernetes.io/docs/concepts/storage/persistent-volumes/' };
const REF_SC = { label: 'Kubernetes Docs — Storage Classes', url: 'https://kubernetes.io/docs/concepts/storage/storage-classes/' };
const REF_VOL = { label: 'Kubernetes Docs — Volumes', url: 'https://kubernetes.io/docs/concepts/storage/volumes/' };
const REF_LOGS = { label: 'Kubernetes Docs — Logging Architecture', url: 'https://kubernetes.io/docs/concepts/cluster-administration/logging/' };
const REF_DEBUG = { label: 'Kubernetes Docs — Troubleshooting Clusters', url: 'https://kubernetes.io/docs/tasks/debug/debug-cluster/' };
const REF_KCTL = { label: 'Kubernetes Docs — kubectl Reference', url: 'https://kubernetes.io/docs/reference/kubectl/' };
const REF_APISVR = { label: 'Kubernetes Docs — kube-apiserver Static Pods', url: 'https://kubernetes.io/docs/tasks/administer-cluster/control-plane-flags/' };

const opts4 = (a: string, b: string, c: string, d: string): Opt[] => [
  { id: 'a', text: a }, { id: 'b', text: b }, { id: 'c', text: c }, { id: 'd', text: d }
];

// ───────────────────── Practice Exam 1 ─────────────────────
const P1: Q[] = [
  // ── Cluster Architecture, Installation & Configuration (5) ──
  {
    domain: CLUSTER, difficulty: 2, type: QType.SINGLE, isTeaser: true,
    stem: 'Which Helm command renders a chart locally to YAML (without installing it) so you can inspect or commit the manifests?',
    options: opts4(
      'helm install --dry-run --debug',
      'helm template <release> <chart>',
      'helm render <release> <chart>',
      'helm get manifest <release>'
    ),
    correct: ['b'],
    explanation: '`helm template` renders the chart to stdout without contacting a cluster. `helm install --dry-run` simulates an install but still requires a kubeconfig and release name; `helm get manifest` reads back an installed release.',
    references: [REF_HELM]
  },
  {
    domain: CLUSTER, difficulty: 3, type: QType.SINGLE, isTeaser: true,
    stem: 'To install argo-cd 7.7.3 with the CRDs already managed separately, which value should be passed?',
    options: opts4(
      '--set crds.install=false',
      '--skip-crds',
      '--no-hooks',
      '--set createNamespace=false'
    ),
    correct: ['a'],
    explanation: 'The argo-cd chart exposes `crds.install` to decouple CRD lifecycle from the release. `--skip-crds` is a Helm-level flag that does not exist on `template`/`install` for arbitrary charts in the same way; the chart-specific value is the documented path.',
    references: [REF_HELM]
  },
  {
    domain: CLUSTER, difficulty: 3, type: QType.SINGLE,
    stem: 'You need to extract every CustomResourceDefinition installed by cert-manager into a single YAML file. Which command works?',
    options: opts4(
      'kubectl get crd cert-manager -o yaml > resources.yaml',
      'kubectl get crd | grep cert-manager | awk \'{print $1}\' | xargs -I{} kubectl get crd {} -o yaml >> resources.yaml',
      'kubectl explain crd --recursive > resources.yaml',
      'kubectl describe crd > resources.yaml'
    ),
    correct: ['b'],
    explanation: 'The filter-and-xargs pipeline lists every CRD whose name contains `cert-manager` and exports each as YAML. `kubectl describe` is human-formatted, not re-applicable; `kubectl explain` documents schema, not instances.',
    references: [REF_CRD]
  },
  {
    domain: CLUSTER, difficulty: 4, type: QType.SINGLE,
    stem: 'You are migrating worker nodes from containerd to cri-dockerd (Mirantis). After installing the `cri-dockerd` package, which command persists the kernel-module/sysctl prerequisites across reboots?',
    options: opts4(
      'echo \'net.ipv4.ip_forward=1\' > /etc/sysctl.conf',
      'Create /etc/sysctl.d/cka.conf with the needed entries and run `sudo sysctl --system`',
      'kubeadm config images pull',
      'systemctl edit kubelet to add `--ip-forward=1`'
    ),
    correct: ['b'],
    explanation: 'Drop-in files under `/etc/sysctl.d/` are reloaded by `sysctl --system`, persisting `net.bridge.bridge-nf-call-iptables`, `net.ipv4.ip_forward`, etc. Editing `/etc/sysctl.conf` works but is discouraged; the others are unrelated.',
    references: [REF_CRI]
  },
  {
    domain: CLUSTER, difficulty: 3, type: QType.MULTI,
    stem: 'Select ALL true statements about the Kubernetes control plane.',
    options: opts4(
      'kube-apiserver is the only component that talks directly to etcd in a default kubeadm install.',
      'kube-scheduler watches for unscheduled Pods and assigns them to nodes via the apiserver.',
      'kube-controller-manager runs as a Deployment in kube-system.',
      'etcd is the cluster\'s single source of truth for object state.'
    ),
    correct: ['a', 'b', 'd'],
    explanation: 'On kubeadm clusters, control-plane components run as **static Pods** managed by the kubelet from `/etc/kubernetes/manifests/`, NOT as Deployments. The other three statements are correct.',
    references: [REF_KUBEADM, REF_ETCD]
  },

  // ── Workloads and Scheduling (3) ──
  {
    domain: WORK, difficulty: 3, type: QType.SINGLE, isTeaser: true,
    stem: 'A Deployment must have a sidecar that tails a log file the main container writes. Which volume type lets both containers share the file inside the Pod?',
    options: opts4(
      'hostPath',
      'emptyDir',
      'configMap',
      'persistentVolumeClaim (RWO)'
    ),
    correct: ['b'],
    explanation: '`emptyDir` is created when the Pod is bound to a node and is shared by every container in the Pod — the standard pattern for sidecar log tailing. hostPath ties to the node filesystem; PVC RWO is unnecessary overhead for ephemeral logs.',
    references: [REF_VOL]
  },
  {
    domain: WORK, difficulty: 3, type: QType.SINGLE,
    stem: 'You taint `node01` with `IT=Kiddie:NoSchedule`. Which toleration on a Pod is necessary and sufficient for it to schedule there?',
    options: opts4(
      '`{ key: "IT", operator: "Exists", effect: "NoExecute" }`',
      '`{ key: "IT", operator: "Equal", value: "Kiddie", effect: "NoSchedule" }`',
      '`{ key: "Kiddie", operator: "Equal", value: "IT", effect: "NoSchedule" }`',
      'No toleration is needed; taints affect only existing Pods.'
    ),
    correct: ['b'],
    explanation: 'A toleration must match the taint exactly on key/value/effect (or use the Exists operator with matching key + effect). NoSchedule blocks new scheduling; NoExecute additionally evicts running Pods.',
    references: [REF_TAINT]
  },
  {
    domain: WORK, difficulty: 4, type: QType.SINGLE,
    stem: 'You create a PriorityClass `high-priority` with value 9_999_999 and patch Deployment `busybox-logger` to use it. The Pods are not preempting lower-priority Pods. What is the MOST likely cause?',
    options: opts4(
      'You need to set `preemptionPolicy: Never`.',
      'The Deployment\'s existing ReplicaSet still references the old template — restart the rollout (e.g. `kubectl rollout restart deploy busybox-logger`).',
      'PriorityClasses below 1_000_000_000 are ignored.',
      'PriorityClass only affects DaemonSets.'
    ),
    correct: ['b'],
    explanation: 'Patching the Deployment spec updates the template but the running Pods belong to the previous ReplicaSet; a `rollout restart` (or any change that creates a new RS) is needed to roll the Pods over with the new priority. Priority is honored on scheduling/preemption.',
    references: [REF_PRIO]
  },

  // ── Services and Networking (4) ──
  {
    domain: NET, difficulty: 2, type: QType.SINGLE, isTeaser: true,
    stem: 'Which command exposes Deployment `frontend` on a port reachable on every node\'s IP at a high (30000–32767) port?',
    options: opts4(
      'kubectl expose deploy frontend --type=ClusterIP --port=80',
      'kubectl expose deploy frontend --type=NodePort --port=80',
      'kubectl expose deploy frontend --type=ExternalName --port=80',
      'kubectl expose deploy frontend --type=Headless --port=80'
    ),
    correct: ['b'],
    explanation: 'NodePort allocates a port from `--service-node-port-range` (default 30000–32767) on every node. ClusterIP is internal-only; ExternalName is a CNAME alias; "Headless" is `clusterIP: None`, not a type.',
    references: [REF_SVC]
  },
  {
    domain: NET, difficulty: 3, type: QType.SINGLE,
    stem: 'An Ingress for the nginx-ingress controller routes `/echo` on host `example.org` to Service `echoserver-service:8080`. From outside the cluster on a NodePort install, the correct test command is:',
    options: opts4(
      'curl http://example.org:80/echo',
      'curl -H "Host: example.org" http://<node-ip>:<ingress-nodeport>/echo',
      'curl http://<service-cluster-ip>:8080/echo',
      'curl --resolve example.org:80:127.0.0.1 http://example.org/echo'
    ),
    correct: ['b'],
    explanation: 'Without DNS, you must hit the ingress-nginx controller\'s NodePort on any node IP and pass `Host: example.org` so the Ingress host rule matches. Hitting the backend Service cluster IP bypasses the Ingress and ignores the path rule.',
    references: [REF_ING]
  },
  {
    domain: NET, difficulty: 3, type: QType.SINGLE,
    stem: 'You want to terminate TLS at the cluster edge using the Gateway API and the nginx-gateway-fabric controller. Which Gateway listener config is correct?',
    options: opts4(
      'protocol: HTTPS, port: 443, tls.mode: Passthrough, certificateRefs omitted',
      'protocol: HTTPS, port: 443, tls.mode: Terminate, certificateRefs: [{ kind: Secret, name: web-tls }]',
      'protocol: TLS, port: 443, tls.mode: Terminate, certificateRefs omitted',
      'protocol: HTTP, port: 443, tls.mode: Terminate'
    ),
    correct: ['b'],
    explanation: 'TLS termination requires `tls.mode: Terminate` plus a Secret of type `kubernetes.io/tls` via `certificateRefs`. Passthrough forwards the TLS connection unmodified. Listener protocol must be HTTPS for HTTPRoute attachment.',
    references: [REF_GW]
  },
  {
    domain: NET, difficulty: 4, type: QType.MULTI,
    stem: 'A NetworkPolicy in namespace `backend` selects pods labelled `app=backend` and allows ingress from pods labelled `app=frontend` in namespace `frontend`. Select ALL true statements.',
    options: opts4(
      'The `from` list must combine a namespaceSelector and a podSelector inside a single peer object (AND), not as separate items (OR).',
      'Two separate peer items {namespaceSelector}, {podSelector} mean "any pod from that namespace OR any pod in this namespace with that label".',
      'A CNI implementing NetworkPolicy (e.g. Calico, Cilium) must be installed.',
      'The policy implicitly allows all egress from the backend pods.'
    ),
    correct: ['a', 'b', 'c', 'd'],
    explanation: 'All four are true. Combining selectors inside one `from` peer object is AND; separate items are OR. Egress is only restricted if the policy lists `policyTypes: [Egress]`.',
    references: [REF_NP]
  },

  // ── Storage (2) ──
  {
    domain: STORE, difficulty: 2, type: QType.SINGLE, isTeaser: true,
    stem: 'Which annotation marks a StorageClass as the cluster default?',
    options: opts4(
      'storageclass.kubernetes.io/is-default-class: "true"',
      'storage.k8s.io/default: "yes"',
      'kubernetes.io/default-sc: "true"',
      'volume.beta.kubernetes.io/default: "true"'
    ),
    correct: ['a'],
    explanation: 'The default StorageClass is identified by the annotation `storageclass.kubernetes.io/is-default-class: "true"`. At most one default should be set at a time; PVCs without `storageClassName` use it.',
    references: [REF_SC]
  },
  {
    domain: STORE, difficulty: 3, type: QType.SINGLE,
    stem: 'A PersistentVolume is `Released` with reclaimPolicy `Retain` and a stale `claimRef`. A new PVC matches it on size and storageClassName but binding fails. What MUST you do to allow rebind?',
    options: opts4(
      'Delete the PV.',
      'Edit the PV and remove the `spec.claimRef` block.',
      'Change reclaim policy to `Delete`.',
      'Scale the workload to zero and back.'
    ),
    correct: ['b'],
    explanation: 'A Retained PV keeps its `claimRef` even after the original PVC is gone, blocking new bindings. Remove `claimRef` (and any obsolete `pv.kubernetes.io/bind-completed` annotation) so the PV returns to `Available`.',
    references: [REF_PV]
  },

  // ── Troubleshooting (6) ──
  {
    domain: TS, difficulty: 2, type: QType.SINGLE, isTeaser: true,
    stem: 'On a kubeadm control-plane node, the apiserver static Pod manifest lives at:',
    options: opts4(
      '/etc/kubernetes/manifests/kube-apiserver.yaml',
      '/etc/kubernetes/static/kube-apiserver.yaml',
      '/var/lib/kubelet/config/kube-apiserver.yaml',
      '/etc/systemd/system/kube-apiserver.service'
    ),
    correct: ['a'],
    explanation: 'kubeadm places control-plane static Pod manifests in `/etc/kubernetes/manifests/`. The kubelet watches this directory and (re)starts the corresponding Pods as files change.',
    references: [REF_APISVR]
  },
  {
    domain: TS, difficulty: 3, type: QType.SINGLE,
    stem: 'The apiserver is down because `--etcd-servers=https://127.0.0.1:2380` was set in the static Pod manifest. Which is the correct fix?',
    options: opts4(
      'Set `--etcd-servers=https://127.0.0.1:2379` (etcd client port) in /etc/kubernetes/manifests/kube-apiserver.yaml',
      'Restart docker',
      'Run `kubeadm reset`',
      'Add `--insecure-port=8080` to the manifest'
    ),
    correct: ['a'],
    explanation: 'etcd serves clients on **2379** and peer traffic on **2380**. The apiserver must connect to the client port. After saving the manifest the kubelet recreates the static Pod automatically.',
    references: [REF_ETCD, REF_APISVR]
  },
  {
    domain: TS, difficulty: 3, type: QType.SINGLE,
    stem: 'A pod is in `Pending` with the event "0/3 nodes are available: 3 node(s) had untolerated taint {node-role.kubernetes.io/control-plane: }". The fix that is MOST appropriate for a normal workload is:',
    options: opts4(
      'Add a toleration for the control-plane taint to the Pod.',
      'Schedule the Pod on a worker node by removing the nodeSelector or adding a worker label.',
      'Remove the control-plane taint from all nodes.',
      'Set `spec.hostNetwork: true`.'
    ),
    correct: ['b'],
    explanation: 'The control-plane taint exists to keep general workloads off the control plane. Either add a worker to the cluster or remove the targeting constraint that forces it onto control plane. Removing the taint cluster-wide is bad practice for production.',
    references: [REF_TAINT]
  },
  {
    domain: TS, difficulty: 3, type: QType.SINGLE,
    stem: '`kubectl logs <pod>` returns "Error from server (BadRequest): previous terminated container ... not found". The container has only ever started once and is currently Running. Which flag explains the error?',
    options: opts4(
      '--follow',
      '--previous',
      '--tail=0',
      '--all-containers'
    ),
    correct: ['b'],
    explanation: '`--previous` asks the kubelet for the prior instance\'s logs, which only exist after at least one restart. The fix is to drop `--previous` (or wait for a restart).',
    references: [REF_LOGS]
  },
  {
    domain: TS, difficulty: 4, type: QType.SINGLE,
    stem: 'A node is `NotReady`. You SSH in and check `systemctl status kubelet` — it is failing to start with "open /var/lib/kubelet/config.yaml: no such file". The MOST likely root cause is:',
    options: opts4(
      'The container runtime is not installed.',
      'The node was never bootstrapped via `kubeadm join` (or its config was deleted).',
      'kube-proxy is crashing.',
      'CoreDNS is misconfigured.'
    ),
    correct: ['b'],
    explanation: '`kubeadm join` writes `/var/lib/kubelet/config.yaml` from the cluster\'s kubelet-config ConfigMap. If absent, the node has not been joined or its files were removed.',
    references: [REF_KUBEADM, REF_DEBUG]
  },
  {
    domain: TS, difficulty: 4, type: QType.SINGLE,
    stem: 'A pod has `requests.memory: 200Mi, limits.memory: 256Mi`. It restarts with `OOMKilled` under load. Which is the safest first remediation?',
    options: opts4(
      'Increase the memory LIMIT after profiling.',
      'Increase the memory REQUEST only.',
      'Add `--oom-score-adj=-1000` to the kubelet.',
      'Disable the liveness probe.'
    ),
    correct: ['a'],
    explanation: 'OOMKilled means the container exceeded its `limits.memory`. Profile actual usage and raise the limit. Increasing only the request changes scheduling but not the cgroup memory cap.',
    references: [REF_RES]
  }
];

// ───────────────────── Practice Exam 2 ─────────────────────
const P2: Q[] = [
  // ── Cluster Architecture (5) ──
  {
    domain: CLUSTER, difficulty: 3, type: QType.SINGLE,
    stem: 'On a kubeadm cluster, what is the recommended order to upgrade the control plane minor version?',
    options: opts4(
      'kubelet → kubeadm → kubectl → apply',
      'kubeadm upgrade plan → kubeadm upgrade apply <ver> → upgrade kubelet & kubectl',
      'kubectl drain → kubeadm reset → kubeadm init',
      'helm upgrade kubernetes'
    ),
    correct: ['b'],
    explanation: 'Always run `kubeadm upgrade plan` first to confirm the target version, then `kubeadm upgrade apply` on the first control-plane node, then upgrade kubelet/kubectl. Workers follow afterwards with `kubeadm upgrade node`.',
    references: [REF_UPGRADE]
  },
  {
    domain: CLUSTER, difficulty: 3, type: QType.SINGLE,
    stem: 'You back up etcd with `ETCDCTL_API=3 etcdctl snapshot save /backup/snap.db`. To restore on a new control plane you should:',
    options: opts4(
      'Copy snap.db into /var/lib/etcd and restart etcd.',
      'Run `etcdctl snapshot restore /backup/snap.db --data-dir=/var/lib/etcd-from-backup` then point the etcd static pod at the new data-dir.',
      'kubectl apply -f snap.db',
      'systemctl restart etcd — it auto-detects snapshots'
    ),
    correct: ['b'],
    explanation: 'Restore writes a brand-new data directory; you then update the etcd static Pod\'s `--data-dir` (and hostPath volume) to that directory. Simply copying the snapshot file is not a valid restore.',
    references: [REF_ETCD]
  },
  {
    domain: CLUSTER, difficulty: 3, type: QType.SINGLE,
    stem: 'Which Role permits read-only access to ConfigMaps in one namespace?',
    options: opts4(
      'apiGroups: [""], resources: ["configmaps"], verbs: ["get","list","watch"]',
      'apiGroups: ["*"], resources: ["*"], verbs: ["*"]',
      'apiGroups: ["rbac.authorization.k8s.io"], resources: ["configmaps"], verbs: ["read"]',
      'apiGroups: ["core/v1"], resources: ["configmap"], verbs: ["view"]'
    ),
    correct: ['a'],
    explanation: 'ConfigMaps are in the core API group (the empty string). Read-only verbs are `get`, `list`, `watch`. Roles vs ClusterRoles differ in scope; this would be a Role for one namespace.',
    references: [REF_RBAC]
  },
  {
    domain: CLUSTER, difficulty: 2, type: QType.SINGLE,
    stem: 'Which command installs Calico via its tigera-operator manifest?',
    options: opts4(
      'kubectl create -f https://raw.githubusercontent.com/projectcalico/calico/v3.29.2/manifests/tigera-operator.yaml',
      'kubeadm init --pod-network-cni=calico',
      'helm install calico stable/calico',
      'kubectl plugin install calico'
    ),
    correct: ['a'],
    explanation: 'Modern Calico installs in two steps: apply `tigera-operator.yaml`, then `custom-resources.yaml` for the operator to roll out the dataplane. There is no `kubectl plugin install calico` command.',
    references: [REF_CNI]
  },
  {
    domain: CLUSTER, difficulty: 4, type: QType.SINGLE,
    stem: 'Across a cluster the kubelet must be configured to set `--cluster-dns=10.96.0.10`. On a kubeadm cluster the canonical place to change this is:',
    options: opts4(
      'Edit /var/lib/kubelet/config.yaml on each node manually.',
      'Edit the `kubelet-config` ConfigMap in kube-system; nodes pick it up after a kubelet restart (or `kubeadm upgrade node`).',
      'Edit /etc/systemd/system/kubelet.service.d/10-kubeadm.conf',
      'Run `kubectl set cluster-dns 10.96.0.10`'
    ),
    correct: ['b'],
    explanation: 'kubeadm centralizes kubelet config in the `kubelet-config` ConfigMap; `kubeadm upgrade node` regenerates the on-node config from it. Hand-editing per-node config drifts and is overwritten on the next upgrade.',
    references: [REF_KUBEADM]
  },

  // ── Workloads & Scheduling (3) ──
  {
    domain: WORK, difficulty: 3, type: QType.SINGLE,
    stem: 'A wordpress Deployment in namespace `relative-fawn` must request 247m CPU and 5417Mi memory per container. The cleanest way to add resource requests to a running Deployment is:',
    options: opts4(
      'kubectl scale deploy wordpress --replicas=0; edit the Deployment to add `resources.requests`; scale back up.',
      'kubectl patch pod ...',
      'Delete the namespace and re-apply.',
      'Use a LimitRange — Deployment spec does not support resources.'
    ),
    correct: ['a'],
    explanation: 'Editing `spec.template.spec.containers[].resources.requests` on the Deployment is the right pattern; scaling to 0 first avoids partial rollout churn. Patching individual Pods is ignored — they belong to a ReplicaSet.',
    references: [REF_RES]
  },
  {
    domain: WORK, difficulty: 3, type: QType.SINGLE,
    stem: 'An HPA targets a Deployment with `minReplicas: 1, maxReplicas: 4, averageUtilization: 50% CPU` and `behavior.scaleDown.stabilizationWindowSeconds: 30`. What does the stabilization window do?',
    options: opts4(
      'Waits 30s of sustained low load before each scale-down to dampen flapping.',
      'Caps scale-down to 30s total.',
      'Disables scaling for the first 30s.',
      'Waits 30s between Pod terminations.'
    ),
    correct: ['a'],
    explanation: 'The stabilization window is the look-back used to pick the highest recommended replicas — for scale-down a longer window dampens reactions to brief utilization dips.',
    references: [REF_HPA]
  },
  {
    domain: WORK, difficulty: 3, type: QType.MULTI,
    stem: 'Select ALL true statements about DaemonSets.',
    options: opts4(
      'A DaemonSet ensures one (or some) Pod runs on every matching node.',
      'DaemonSet Pods bypass the default scheduler; the kubelet binds them directly.',
      'Adding a node automatically creates a Pod from the DaemonSet on that node.',
      'A DaemonSet works well for node-level agents (CNI, log collectors, monitoring).'
    ),
    correct: ['a', 'c', 'd'],
    explanation: 'Since k8s 1.17 the default scheduler IS used for DaemonSet Pods (controller adds NodeAffinity); they are no longer scheduled directly by the kubelet. The other three are textbook DaemonSet properties.',
    references: [REF_DS]
  },

  // ── Services & Networking (4) ──
  {
    domain: NET, difficulty: 2, type: QType.SINGLE,
    stem: 'Service `db` in namespace `production` is addressed by Pods in namespace `web` as:',
    options: opts4(
      'db',
      'db.web.svc.cluster.local',
      'db.production.svc.cluster.local',
      'production.db.cluster.local'
    ),
    correct: ['c'],
    explanation: 'Cross-namespace DNS uses `<svc>.<ns>.svc.cluster.local`. Same-namespace short names (`db`) resolve via the DNS search list.',
    references: [REF_DNS]
  },
  {
    domain: NET, difficulty: 3, type: QType.SINGLE,
    stem: 'You replace an Ingress with a Gateway+HTTPRoute. The HTTPRoute must select an existing Gateway. Which field links them?',
    options: opts4(
      'spec.gatewayName',
      'spec.parentRefs',
      'metadata.ownerReferences',
      'spec.controller'
    ),
    correct: ['b'],
    explanation: 'HTTPRoute uses `spec.parentRefs` (a list of objects) to attach to one or more Gateways/listeners. There is no `gatewayName` field on HTTPRoute.',
    references: [REF_GW]
  },
  {
    domain: NET, difficulty: 3, type: QType.SINGLE,
    stem: 'A LoadBalancer Service stays `Pending`. The cluster is bare-metal. The MOST appropriate fix is:',
    options: opts4(
      'Wait — kube-controller-manager will create the load balancer eventually.',
      'Install a bare-metal LB provider such as MetalLB or kube-vip.',
      'Switch the Service to ExternalName.',
      'Set `externalTrafficPolicy: Local`.'
    ),
    correct: ['b'],
    explanation: 'Cloud LoadBalancers are reconciled by a cloud-controller. On bare metal you need MetalLB / kube-vip / similar to allocate external IPs. `externalTrafficPolicy` only affects packet routing, not allocation.',
    references: [REF_SVC]
  },
  {
    domain: NET, difficulty: 4, type: QType.SINGLE,
    stem: 'CoreDNS pods are CrashLoopBackOff with "Loop (127.0.0.1:53 -> :53) detected for zone .". The fix is:',
    options: opts4(
      'Delete CoreDNS Pods — the issue is transient.',
      'In the CoreDNS Corefile, replace the upstream `forward . /etc/resolv.conf` with explicit upstream resolvers (e.g. 8.8.8.8) so it does not forward to itself.',
      'Disable kube-proxy.',
      'Set Pod DNS policy to `None`.'
    ),
    correct: ['b'],
    explanation: 'A loop occurs when the node\'s /etc/resolv.conf points to a local resolver that itself forwards to CoreDNS. Replace the forward target with the actual upstream DNS or fix the host resolv.conf.',
    references: [REF_DNS]
  },

  // ── Storage (2) ──
  {
    domain: STORE, difficulty: 3, type: QType.SINGLE,
    stem: 'Create a new StorageClass `low-latency` using the local-path provisioner that defers binding until a Pod needs the volume. Which `volumeBindingMode` is correct?',
    options: opts4(
      'Immediate',
      'WaitForFirstConsumer',
      'OnDemand',
      'Deferred'
    ),
    correct: ['b'],
    explanation: '`WaitForFirstConsumer` postpones PV provisioning and binding until a Pod using the PVC is scheduled — essential for topology-aware (e.g. local) volumes. `OnDemand`/`Deferred` are not valid values.',
    references: [REF_SC]
  },
  {
    domain: STORE, difficulty: 3, type: QType.SINGLE,
    stem: 'A PVC requests 250Mi but the matching pre-provisioned PV is 1Gi. The binding behavior is:',
    options: opts4(
      'Fails — sizes must match exactly.',
      'Succeeds — the PVC binds to a PV whose capacity is ≥ requested.',
      'Succeeds — but the Pod sees only 250Mi.',
      'Fails — capacity downscaling is not allowed.'
    ),
    correct: ['b'],
    explanation: 'PV binding requires capacity ≥ requested. The Pod sees the full PV capacity; the PVC field is a *minimum* request, not a quota.',
    references: [REF_PV]
  },

  // ── Troubleshooting (6) ──
  {
    domain: TS, difficulty: 2, type: QType.SINGLE,
    stem: 'Which command lists running containers on a node using the CRI directly (independent of kubectl)?',
    options: opts4(
      'docker ps',
      'crictl ps',
      'kubeadm ps',
      'systemctl list-containers'
    ),
    correct: ['b'],
    explanation: '`crictl` is the standard CLI for CRI-compatible runtimes (containerd, cri-o, cri-dockerd) and is what the CKA exam expects on modern clusters. `docker ps` only works if a Docker runtime is installed.',
    references: [REF_CRI]
  },
  {
    domain: TS, difficulty: 3, type: QType.SINGLE,
    stem: 'A Pod has `ImagePullBackOff` and `kubectl describe pod` shows "pull access denied for private/repo:v1". The fix is:',
    options: opts4(
      'Create a `kubernetes.io/dockerconfigjson` Secret and reference it via `spec.imagePullSecrets`.',
      'Restart the kubelet.',
      'Set `imagePullPolicy: Never`.',
      'Use a NodePort Service for the registry.'
    ),
    correct: ['a'],
    explanation: 'Authenticated pulls require an `imagePullSecrets` reference on the Pod (or ServiceAccount) containing a `dockerconfigjson` Secret with the registry credentials.',
    references: [REF_KCTL]
  },
  {
    domain: TS, difficulty: 3, type: QType.SINGLE,
    stem: 'Two containers in a Pod must communicate over a NEW TLS-1.3-only nginx config exposed via a ConfigMap. After editing the ConfigMap, the new TLS settings are not active. The MOST likely cause is:',
    options: opts4(
      'ConfigMaps mounted as a volume update lazily — restart the Deployment so the new file is read at startup, or use a sidecar that watches for changes.',
      'TLS 1.3 is not supported in Kubernetes.',
      'The kube-proxy must be restarted.',
      'NetworkPolicy is dropping the connection.'
    ),
    correct: ['a'],
    explanation: 'ConfigMap volume mounts are eventually consistent, but the consuming process (nginx) only re-reads on reload. `kubectl rollout restart deploy` or sending a SIGHUP via a sidecar applies the new config.',
    references: [REF_KCTL]
  },
  {
    domain: TS, difficulty: 3, type: QType.SINGLE,
    stem: 'Inspecting `journalctl -u kubelet -f` reveals "Failed to start ContainerManager: failed to initialise top-level QOS containers: ... cgroupfs vs systemd". The fix is:',
    options: opts4(
      'Set the kubelet `cgroupDriver` to match the container runtime (typically `systemd` on modern installs).',
      'Disable swap.',
      'Reinstall the OS.',
      'Upgrade kubectl.'
    ),
    correct: ['a'],
    explanation: 'kubelet and CRI must agree on the cgroup driver. On systemd-based hosts both should use `systemd`. Mismatched drivers prevent the kubelet from starting.',
    references: [REF_CRI]
  },
  {
    domain: TS, difficulty: 4, type: QType.SINGLE,
    stem: '`kubectl get nodes` returns "Unable to connect to the server: x509: certificate signed by unknown authority". The MOST likely root cause for a working operator is:',
    options: opts4(
      'The cluster is down.',
      'Your kubeconfig points to a stale CA — refresh the kubeconfig (e.g. `kubeadm kubeconfig user --client-name=admin` or pull a fresh one).',
      'CoreDNS is broken.',
      'kube-proxy is in iptables mode.'
    ),
    correct: ['b'],
    explanation: 'TLS verification failure against the API server\'s cert almost always means the kubeconfig CA does not match — rotate or regenerate the kubeconfig.',
    references: [REF_DEBUG]
  },
  {
    domain: TS, difficulty: 4, type: QType.SINGLE,
    stem: 'A control-plane Pod (e.g. kube-scheduler) is missing from `kubectl get pods -n kube-system`. The kubelet logs show it is "not running". The first place to look is:',
    options: opts4(
      '/var/log/syslog',
      '/etc/kubernetes/manifests/kube-scheduler.yaml — confirm the static-Pod file exists and is syntactically valid.',
      'systemctl status kube-scheduler',
      'kubectl describe deploy kube-scheduler -n kube-system'
    ),
    correct: ['b'],
    explanation: 'On kubeadm clusters scheduler/controller-manager/apiserver run as static Pods from `/etc/kubernetes/manifests/`. A missing or broken manifest is the typical cause. There is no Deployment or systemd unit for them.',
    references: [REF_APISVR]
  }
];

// ───────────────────── Practice Exam 3 ─────────────────────
const P3: Q[] = [
  // ── Cluster Architecture (5) ──
  {
    domain: CLUSTER, difficulty: 3, type: QType.SINGLE,
    stem: 'A user `dev1` must be able to list and get Pods cluster-wide but mutate nothing. The MINIMUM RBAC binding required is:',
    options: opts4(
      'A Role + RoleBinding in every namespace.',
      'A ClusterRole with `verbs: [get,list,watch]` on `pods` + a ClusterRoleBinding to user `dev1`.',
      'A ClusterRole with `verbs: ["*"]` + ClusterRoleBinding.',
      'A Role with `verbs: ["*"]` + RoleBinding to the default namespace.'
    ),
    correct: ['b'],
    explanation: 'Cluster-wide read of a core resource is a ClusterRole bound via ClusterRoleBinding. A Role is namespace-scoped; wildcard verbs over-privilege.',
    references: [REF_RBAC]
  },
  {
    domain: CLUSTER, difficulty: 2, type: QType.SINGLE,
    stem: 'Which command renders the spec of an installed CRD field so you can author a CR against it?',
    options: opts4(
      'kubectl describe crd <name>',
      'kubectl explain <kind>.<path> (e.g. certificates.spec.subject)',
      'kubectl api-versions',
      'kubectl proxy --crd'
    ),
    correct: ['b'],
    explanation: '`kubectl explain` reads the openAPI schema from the apiserver, including CRD schemas. It supports dotted paths for nested fields.',
    references: [REF_CRD]
  },
  {
    domain: CLUSTER, difficulty: 3, type: QType.SINGLE,
    stem: 'After `kubeadm init`, the message instructs you to run `kubectl ... --kubeconfig=/etc/kubernetes/admin.conf` or copy that file to `$HOME/.kube/config`. Which is INCORRECT about that file?',
    options: opts4(
      'It contains an admin client cert/key.',
      'It is safe to share with developers as-is.',
      'Its CA cert matches the apiserver\'s cert.',
      'Its server URL is the apiserver advertise address.'
    ),
    correct: ['b'],
    explanation: '`admin.conf` is cluster-admin; never hand it to developers. Generate per-user kubeconfigs (e.g. via `kubeadm kubeconfig user`) with scoped RBAC.',
    references: [REF_KUBEADM, REF_RBAC]
  },
  {
    domain: CLUSTER, difficulty: 3, type: QType.SINGLE,
    stem: 'On a fresh single-node cluster, after `kubeadm init` the apiserver is healthy but `kubectl get nodes` shows the node `NotReady`. The MOST likely remaining step is:',
    options: opts4(
      'Apply a CNI manifest (e.g. Calico / Flannel) so the node Ready condition can transition.',
      'Restart the kubelet.',
      'Set `--allow-privileged=true` on the apiserver.',
      'Disable swap (kubeadm already does this).'
    ),
    correct: ['a'],
    explanation: 'Node Ready requires a working network plugin. Without a CNI the kubelet reports `NetworkUnavailable` and the node stays NotReady.',
    references: [REF_CNI]
  },
  {
    domain: CLUSTER, difficulty: 4, type: QType.MULTI,
    stem: 'Select ALL valid placements for cri-dockerd in a CKA exam context.',
    options: opts4(
      'cri-dockerd is required if you keep Docker as the runtime past k8s 1.24.',
      'cri-dockerd is a CRI shim that lets the kubelet talk to dockerd.',
      'cri-dockerd is a CNI plugin.',
      'Default kubeadm clusters typically use containerd, not cri-dockerd.'
    ),
    correct: ['a', 'b', 'd'],
    explanation: 'cri-dockerd is a runtime shim, not a CNI plugin. It exists because the in-tree dockershim was removed in 1.24. Modern kubeadm clusters default to containerd.',
    references: [REF_CRI]
  },

  // ── Workloads & Scheduling (3) ──
  {
    domain: WORK, difficulty: 3, type: QType.SINGLE,
    stem: 'Two Pods MUST run on different nodes. Which scheduling primitive expresses this?',
    options: opts4(
      'podAffinity with `topologyKey: kubernetes.io/hostname`',
      'podAntiAffinity with `topologyKey: kubernetes.io/hostname`',
      'nodeSelector: { distinct: "true" }',
      'PriorityClass preemption'
    ),
    correct: ['b'],
    explanation: 'PodAntiAffinity with hostname topology rejects nodes that already run a matching Pod, achieving spread-by-host.',
    references: [REF_AFFIN]
  },
  {
    domain: WORK, difficulty: 3, type: QType.SINGLE,
    stem: 'You need a sidecar that runs FOR THE LIFETIME of the main container and shares a log volume. In recent Kubernetes versions, the recommended way is:',
    options: opts4(
      'Add it as a second container under `spec.containers[]` sharing an emptyDir volume.',
      'Add it as an initContainer.',
      'Run it as a separate Deployment.',
      'Use a Job.'
    ),
    correct: ['a'],
    explanation: 'Classic sidecars are simply additional containers in the Pod sharing volumes. The native "sidecar initContainer" (`restartPolicy: Always` on an initContainer) is a newer beta pattern for sidecars whose startup must precede the main container.',
    references: [REF_DEPLOY]
  },
  {
    domain: WORK, difficulty: 4, type: QType.SINGLE,
    stem: 'A Deployment has 3 replicas and `maxSurge: 1, maxUnavailable: 0`. During rollout, how many Pods total can exist simultaneously?',
    options: opts4(
      '3',
      '4',
      '5',
      '6'
    ),
    correct: ['b'],
    explanation: '`maxSurge: 1` allows one extra Pod above desired (3 → up to 4). `maxUnavailable: 0` blocks dropping below desired Ready count.',
    references: [REF_DEPLOY]
  },

  // ── Services & Networking (4) ──
  {
    domain: NET, difficulty: 3, type: QType.SINGLE,
    stem: 'You want headless DNS so clients can resolve INDIVIDUAL Pod IPs of a StatefulSet. The Service config is:',
    options: opts4(
      'type: ClusterIP, clusterIP: None, selector: { app: db }',
      'type: NodePort, headless: true',
      'type: ExternalName, externalName: db',
      'type: ClusterIP with externalTrafficPolicy: Local'
    ),
    correct: ['a'],
    explanation: 'Setting `clusterIP: None` (with a selector) makes the Service headless. CoreDNS returns A records for each backing Pod\'s IP — required for StatefulSet stable per-Pod DNS.',
    references: [REF_SVC, REF_DNS]
  },
  {
    domain: NET, difficulty: 3, type: QType.SINGLE,
    stem: 'A NetworkPolicy applied to `podSelector: {}` with `policyTypes: [Ingress, Egress]` and no `ingress`/`egress` rules has what effect on Pods in that namespace?',
    options: opts4(
      'Allow all ingress and egress.',
      'Default-deny all ingress AND all egress.',
      'No effect.',
      'Default-deny only intra-namespace traffic.'
    ),
    correct: ['b'],
    explanation: 'An empty selector matches every Pod; declaring both policyTypes with empty rule lists denies all traffic of those types. This is the classic "default deny" pattern.',
    references: [REF_NP]
  },
  {
    domain: NET, difficulty: 3, type: QType.SINGLE,
    stem: 'In the `gateway.networking.k8s.io/v1` API, which resource declares the controller implementation (e.g. nginx) that processes Gateways?',
    options: opts4(
      'GatewayClass',
      'Gateway',
      'HTTPRoute',
      'ReferenceGrant'
    ),
    correct: ['a'],
    explanation: '`GatewayClass` is the cluster-scoped resource that names the controller (e.g. `nginx`). A Gateway selects a GatewayClass; HTTPRoute attaches to a Gateway.',
    references: [REF_GW]
  },
  {
    domain: NET, difficulty: 4, type: QType.SINGLE,
    stem: 'An Ingress route 80→8080 stops working after migrating from ingress-nginx Ingress to a Gateway+HTTPRoute. Both resources exist temporarily. The CORRECT cleanup is:',
    options: opts4(
      'Delete the old Ingress with `kubectl delete ingress <name> -n <ns>`.',
      'Leave both — they coexist.',
      'Delete the GatewayClass.',
      'Set the Ingress annotation `disabled: true`.'
    ),
    correct: ['a'],
    explanation: 'Once HTTPRoute is verified working, delete the Ingress to avoid double-routing and resource churn. There is no `disabled: true` annotation in the Ingress API.',
    references: [REF_GW, REF_ING]
  },

  // ── Storage (2) ──
  {
    domain: STORE, difficulty: 3, type: QType.SINGLE,
    stem: 'You need a StatefulSet whose Pods each get their own PVC sized 1Gi. The mechanism is:',
    options: opts4(
      'spec.volumeClaimTemplates on the StatefulSet',
      'spec.template.spec.volumes (one PVC reused)',
      'A Deployment with `replicas: N` and a shared PVC',
      'PriorityClass with `volumeQuota`'
    ),
    correct: ['a'],
    explanation: '`volumeClaimTemplates` materializes a fresh PVC per ordinal Pod, satisfying per-Pod persistence in StatefulSets. A single PVC referenced via `volumes` would be shared — not what you want.',
    references: [REF_PV]
  },
  {
    domain: STORE, difficulty: 3, type: QType.SINGLE,
    stem: 'A PVC of size 1Gi must be expanded to 5Gi online. The PRE-REQUISITE on the StorageClass is:',
    options: opts4(
      'reclaimPolicy: Retain',
      'allowVolumeExpansion: true',
      'volumeBindingMode: Immediate',
      'parameters.fsType: ext4'
    ),
    correct: ['b'],
    explanation: '`allowVolumeExpansion: true` on the StorageClass is required; then editing the PVC `resources.requests.storage` triggers an online resize (provisioner-dependent).',
    references: [REF_SC]
  },

  // ── Troubleshooting (6) ──
  {
    domain: TS, difficulty: 2, type: QType.SINGLE,
    stem: 'A Pod\'s containerPort `80` is declared but the Service\'s `targetPort` is `8080`. Symptom?',
    options: opts4(
      '503 / connection refused — Service forwards to a port the Pod is not listening on.',
      'Pods crash on startup.',
      'NetworkPolicy blocks the traffic.',
      'Ingress returns 404.'
    ),
    correct: ['a'],
    explanation: 'Service `targetPort` is the Pod port the kube-proxy DNATs to. A mismatch with the actually-listening port produces refused/timeout — not a Pod crash.',
    references: [REF_SVC]
  },
  {
    domain: TS, difficulty: 3, type: QType.SINGLE,
    stem: 'You suspect the scheduler is wedged. Which command surfaces "FailedScheduling" reasons for a specific Pod?',
    options: opts4(
      'kubectl get events --field-selector involvedObject.name=<pod>',
      'kubectl logs deploy/kube-scheduler -n kube-system',
      'kubectl describe deploy <pod>',
      'kubectl proxy --debug'
    ),
    correct: ['a'],
    explanation: '`kubectl describe pod <pod>` also surfaces the same events. Filtering via field-selector is a more programmatic equivalent. Scheduler logs help too but require deeper access.',
    references: [REF_DEBUG]
  },
  {
    domain: TS, difficulty: 3, type: QType.SINGLE,
    stem: 'kube-proxy is logging "can\'t open iptables lock". The fix is:',
    options: opts4(
      'Run kube-proxy with hostNetwork (it already does).',
      'Add the privileged securityContext or required capabilities; ensure xtables-lock is mounted from /run/xtables.lock.',
      'Disable iptables and use ipvs without configuration.',
      'Restart the apiserver.'
    ),
    correct: ['b'],
    explanation: 'kube-proxy manipulates iptables on the host and needs the host\'s xtables lock and capabilities (NET_ADMIN, SYS_MODULE). The canonical DaemonSet manifest mounts `/run/xtables.lock`.',
    references: [REF_DEBUG]
  },
  {
    domain: TS, difficulty: 3, type: QType.SINGLE,
    stem: 'Pods on `node02` are stuck in `ContainerCreating`. `kubectl describe pod` shows "NetworkPlugin cni failed to set up pod ... no IP addresses available in range set". The MOST likely root cause is:',
    options: opts4(
      'PodCIDR allocated to the node is exhausted — investigate via the CNI and free / expand the range.',
      'kube-proxy is down.',
      'CoreDNS is broken.',
      'NodePort range is full.'
    ),
    correct: ['a'],
    explanation: 'Each node gets a slice of the cluster Pod CIDR. When that range is exhausted, the CNI IPAM returns "no IP available". Solutions: increase per-node range or scale out nodes.',
    references: [REF_CNI]
  },
  {
    domain: TS, difficulty: 4, type: QType.SINGLE,
    stem: '`kubectl drain node01 --ignore-daemonsets --delete-emptydir-data` hangs on a PodDisruptionBudget. The CORRECT next step is:',
    options: opts4(
      'Wait for capacity to free up so the eviction can complete.',
      'Use --force --grace-period=0 to delete the Pods (last resort — bypasses graceful termination).',
      'Delete the PDB without consideration.',
      'kubeadm reset node01'
    ),
    correct: ['a'],
    explanation: 'A PDB respecting eviction will block until enough replicas can be moved while satisfying minAvailable. Scaling out (or rescheduling other Pods) typically unblocks the drain. `--force` is the destructive escape hatch.',
    references: [REF_KCTL]
  },
  {
    domain: TS, difficulty: 4, type: QType.SINGLE,
    stem: '`kubectl exec` returns "error: unable to upgrade connection: container not found ("XYZ")" yet the Pod is Running. The MOST likely cause is:',
    options: opts4(
      'Pod has multiple containers and you must pass `-c <name>` for the right one.',
      'apiserver is down.',
      'kubelet TLS cert has expired.',
      'NetworkPolicy blocks exec.'
    ),
    correct: ['a'],
    explanation: 'When the pod has multiple containers, omitting `-c` selects the default, which may not exist by the name kubectl is logging in the error. Specify the container explicitly.',
    references: [REF_KCTL]
  }
];

const CKA_DOMAINS = [
  { name: CLUSTER, weight: 25 },
  { name: WORK, weight: 15 },
  { name: NET, weight: 20 },
  { name: STORE, weight: 10 },
  { name: TS, weight: 30 }
];

const CKA_EXAMS: { slug: string; code: string; titleSuffix: string; descriptionSuffix: string; questions: Q[] }[] = [
  {
    slug: 'linuxfoundation-cka-p1',
    code: 'CKA-P1',
    titleSuffix: 'Practice Exam 1',
    descriptionSuffix: 'Practice exam 1 of 3 — full 120-minute, 20-question, blueprint-weighted set covering kubeadm install, etcd, RBAC, scheduling (taints/affinity/priority), Services & Ingress/Gateway API, NetworkPolicies, PV/PVC/StorageClasses, and the troubleshooting workflows tested by the TGS-2025054612-CKA labs.',
    questions: P1
  },
  {
    slug: 'linuxfoundation-cka-p2',
    code: 'CKA-P2',
    titleSuffix: 'Practice Exam 2',
    descriptionSuffix: 'Practice exam 2 of 3 — a second 120-minute, 20-question, blueprint-weighted set.',
    questions: P2
  },
  {
    slug: 'linuxfoundation-cka-p3',
    code: 'CKA-P3',
    titleSuffix: 'Practice Exam 3',
    descriptionSuffix: 'Practice exam 3 of 3 — a third 120-minute, 20-question, blueprint-weighted set.',
    questions: P3
  }
];

const CKA_BUNDLE = {
  slug: 'linuxfoundation-cka',
  title: 'Certified Kubernetes Administrator (CKA)',
  description: 'All 3 CKA practice exams in one bundle — covering cluster architecture & install (kubeadm, etcd, RBAC, CRDs, CNI), workloads & scheduling, services & networking (Ingress + Gateway API), storage, and troubleshooting. Aligned to the CNCF CKA v1.32 blueprint.',
  price: 2000, // USD 20 — PRACTICE tier
  priceVoucher: 39500 // USD 395 — VOUCHER tier (matches CKA real-exam fee)
};

type SeedResult = {
  vendor: 'created' | 'updated';
  exams: { slug: string; questionCount: number; teaserCount: number }[];
  bundle: 'created' | 'updated';
};

/**
 * Idempotent seed for the CKA bundle. Safe to call repeatedly — vendor /
 * exam / bundle rows are upserted, and questions tagged
 * `generatedBy: 'manual:cka-seed'` are deleted and re-created.
 */
export async function seedCka(db: PrismaClient): Promise<SeedResult> {
  const existingVendor = await db.vendor.findUnique({ where: { slug: 'linuxfoundation' } });
  await db.vendor.upsert({
    where: { slug: 'linuxfoundation' },
    update: { name: 'Linux Foundation', description: 'CNCF / Linux Foundation certifications — CKAD, CKA, CKS, and other open-source ecosystem credentials.' },
    create: { slug: 'linuxfoundation', name: 'Linux Foundation', description: 'CNCF / Linux Foundation certifications — CKAD, CKA, CKS, and other open-source ecosystem credentials.' }
  });
  const vendor = await db.vendor.findUniqueOrThrow({ where: { slug: 'linuxfoundation' } });

  const examResults: SeedResult['exams'] = [];
  const examIds: Record<string, string> = {};

  for (const e of CKA_EXAMS) {
    const title = `Certified Kubernetes Administrator (CKA) — ${e.titleSuffix}`;
    const description = `${e.descriptionSuffix} Aligned to CNCF CKA v1.32.`;
    const examData = {
      title,
      code: e.code,
      description,
      level: 'Associate',
      durationMinutes: 120,
      passingScore: 66,
      questionCount: e.questions.length,
      domains: CKA_DOMAINS,
      published: true
    };
    const exam = await db.exam.upsert({
      where: { slug: e.slug },
      update: examData,
      create: { ...examData, slug: e.slug, vendorId: vendor.id }
    });
    examIds[e.slug] = exam.id;

    await db.question.deleteMany({ where: { examId: exam.id, generatedBy: 'manual:cka-seed' } });
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
          generatedBy: 'manual:cka-seed',
          isTeaser: !!q.isTeaser
        }
      });
      if (q.isTeaser) teaserCount++;
    }
    examResults.push({ slug: e.slug, questionCount: e.questions.length, teaserCount });
  }

  const existingBundle = await db.bundle.findUnique({ where: { slug: CKA_BUNDLE.slug } });
  const bundle = await db.bundle.upsert({
    where: { slug: CKA_BUNDLE.slug },
    update: {
      title: CKA_BUNDLE.title,
      description: CKA_BUNDLE.description,
      price: CKA_BUNDLE.price,
      priceVoucher: CKA_BUNDLE.priceVoucher,
      published: true
    },
    create: {
      slug: CKA_BUNDLE.slug,
      title: CKA_BUNDLE.title,
      description: CKA_BUNDLE.description,
      price: CKA_BUNDLE.price,
      priceVoucher: CKA_BUNDLE.priceVoucher,
      published: true
    }
  });

  await db.bundleItem.deleteMany({ where: { bundleId: bundle.id } });
  const items = [
    { examSlug: 'linuxfoundation-cka-p1', tier: 'PRACTICE' as const, position: 1 },
    { examSlug: 'linuxfoundation-cka-p2', tier: 'PRACTICE' as const, position: 2 },
    { examSlug: 'linuxfoundation-cka-p3', tier: 'PRACTICE' as const, position: 3 },
    { examSlug: 'linuxfoundation-cka-p1', tier: 'VOUCHER' as const, position: 4 }
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
