pipeline {
    agent any

    environment {
        DOCKER_IMAGE = "punkk/blue-green-demo"
    }

    stages {

        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Determine Active Slot') {
            steps {
                script {
                    def activeSlot = sh(
                        script: "kubectl get service myapp-service -o jsonpath='{.spec.selector.slot}' 2>/dev/null || echo 'blue'",
                        returnStdout: true
                    ).trim()
                    env.ACTIVE_SLOT = activeSlot
                    env.NEW_SLOT = (activeSlot == 'blue') ? 'green' : 'blue'
                    echo "Active slot: ${env.ACTIVE_SLOT}"
                    echo "Deploying to: ${env.NEW_SLOT}"
                }
            }
        }

        stage('Build Docker Image') {
            steps {
                sh "docker build -t ${DOCKER_IMAGE}:${env.NEW_SLOT} ."
            }
        }

        stage('Push to Docker Hub') {
            steps {
                withCredentials([usernamePassword(
                    credentialsId: 'dockerhub-creds',
                    usernameVariable: 'DOCKER_USER',
                    passwordVariable: 'DOCKER_PASS'
                )]) {
                    sh "echo $DOCKER_PASS | docker login -u $DOCKER_USER --password-stdin"
                    sh "docker push ${DOCKER_IMAGE}:${env.NEW_SLOT}"
                }
            }
        }

        stage('Deploy to Inactive Slot') {
            steps {
                sh "kubectl apply -f k8s/${env.NEW_SLOT}-deployment.yaml"
                sh "kubectl rollout status deployment/myapp-${env.NEW_SLOT}"
            }
        }

        stage('Switch Traffic') {
            steps {
                sh """
                    kubectl patch service myapp-service \
                    -p '{"spec":{"selector":{"app":"myapp","slot":"${env.NEW_SLOT}"}}}'
                """
                echo "Traffic switched to ${env.NEW_SLOT}!"
            }
        }

        stage('Verify') {
            steps {
                sh "kubectl get pods"
                sh "kubectl get service myapp-service"
                echo "Deployment complete. ${env.NEW_SLOT} is now live!"
            }
        }
    }

    post {
        success { echo "Blue-Green deployment successful! ${env.NEW_SLOT} is live." }
        failure {
            echo "Deployment failed! Rolling back to ${env.ACTIVE_SLOT}..."
            sh "kubectl patch service myapp-service -p '{\"spec\":{\"selector\":{\"app\":\"myapp\",\"slot\":\"${env.ACTIVE_SLOT}\"}}}'"
        }
    }
}
