pipeline {
    agent {
        kubernetes {
            yaml '''
apiVersion: v1
kind: Pod
spec:
  containers:
  - name: sonar-scanner
    image: sonarsource/sonar-scanner-cli
    command:
    - cat
    tty: true
  - name: kubectl
    image: bitnami/kubectl:latest
    command:
    - cat
    tty: true
    securityContext:
      runAsUser: 0
      readOnlyRootFilesystem: false
    env:
    - name: KUBECONFIG
      value: /kube/config        
    volumeMounts:
    - name: kubeconfig-secret
      mountPath: /kube/config
      subPath: kubeconfig
  - name: dind
    image: docker:dind
    args: ["--registry-mirror=https://mirror.gcr.io", "--storage-driver=overlay2"]
    securityContext:
      privileged: true  # Needed to run Docker daemon
    env:
    - name: DOCKER_TLS_CERTDIR
      value: ""  # Disable TLS for simplicity
    volumeMounts:
    - name: docker-config
      mountPath: /etc/docker/daemon.json
      subPath: daemon.json  # Mount the file directly here
  volumes:
  - name: docker-config
    configMap:
      name: docker-daemon-config
  - name: kubeconfig-secret
    secret:
      secretName: kubeconfig-secret
'''
        }
    }

    environment {

        // ===== UPDATE THESE 3 =====
        REGISTRY   = "nexus-service-for-docker-hosted-registry.nexus.svc.cluster.local:8085"
        REPO_PATH  = "introconnect-repo"     
        NAMESPACE  = "2401075"

        // ===== IMAGES FOR YOUR PROJECT =====
        BACKEND_IMAGE  = "introconnect-backend"
        FRONTEND_IMAGE = "introconnect-frontend"
        IMAGE_TAG      = "v1"

        // ======== SONAR CONFIG ========
        SONAR_PROJECT_KEY = "IntroConnect"
        SONAR_HOST_URL    = "http://my-sonarqube-sonarqube.sonarqube.svc.cluster.local:9000"
        SONAR_LOGIN       = "sqp_08597ce2ed0908d3a22170c3d5269ac22d8d7fcd"
    }

    stages {

        stage('Install & Build Backend + Frontend') {
            steps {
                container('node') {
                    sh '''
                        echo "=== Install Backend ==="
                        cd backend
                        npm install
                        npm run build || echo "Backend does not need build"
                        cd ..

                        echo "=== Install Frontend ==="
                        cd frontend
                        npm install
                        npm run build
                        cd ..
                    '''
                }
            }
        }

        stage('Build Docker Images') {
            steps {
                container('dind') {
                    sh '''
                        sleep 10

                        echo "=== Build backend image ==="
                        docker build -t ${BACKEND_IMAGE}:latest ./backend

                        echo "=== Build frontend image ==="
                        docker build -t ${FRONTEND_IMAGE}:latest ./frontend
                    '''
                }
            }
        }

        stage('SonarQube Analysis') {
            steps {
                container('sonar-scanner') {
                    sh '''
                        sonar-scanner \
                          -Dsonar.projectKey=2401075-IntroConnect\
                          -Dsonar.sources=. \
                          -Dsonar.host.url=http://my-sonarqube-sonarqube.sonarqube.svc.cluster.local:9000\
                          -Dsonar.login=sqp_08597ce2ed0908d3a22170c3d5269ac22d8d7fcd
                    '''
                }
            }
        }

        stage('Login to Nexus Registry') {
            steps {
                container('dind') {
                    sh '''
                        docker login ${REGISTRY} \
                        --username admin \
                        --password Changeme@2025 \
                        --tls-verify=false
                    '''
                }
            }
        }

        stage('Tag & Push Images to Nexus') {
            steps {
                container('dind') {
                    sh '''
                        echo "=== Tagging backend image ==="
                        docker tag ${BACKEND_IMAGE}:latest  ${REGISTRY}/${REPO_PATH}/${BACKEND_IMAGE}:${IMAGE_TAG}

                        echo "=== Tagging frontend image ==="
                        docker tag ${FRONTEND_IMAGE}:latest ${REGISTRY}/${REPO_PATH}/${FRONTEND_IMAGE}:${IMAGE_TAG}

                        echo "=== Pushing images ==="
                        docker push ${REGISTRY}/${REPO_PATH}/${BACKEND_IMAGE}:${IMAGE_TAG}
                        docker push ${REGISTRY}/${REPO_PATH}/${FRONTEND_IMAGE}:${IMAGE_TAG}
                    '''
                }
            }
        }

        stage('Deploy to Kubernetes') {
            steps {
                container('kubectl') {
                    sh '''
                        echo "=== Applying Kubernetes YAML ==="
                        kubectl apply -f k8s/deployment.yaml -n ${NAMESPACE}
                        kubectl apply -f k8s/service.yaml -n ${NAMESPACE}

                        echo "=== Checking rollouts ==="
                        kubectl rollout status deployment/introconnect-backend -n ${NAMESPACE}
                        kubectl rollout status deployment/introconnect-frontend -n ${NAMESPACE}
                    '''
                }
            }
        }
    }

    post {
        success {
            echo "🚀 IntroConnect deployed successfully!"
        }
        failure {
            echo "❌ Pipeline failed. Check logs."
        }
    }
}
