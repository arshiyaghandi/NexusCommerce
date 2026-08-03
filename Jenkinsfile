pipeline {
    agent any
    
    tools {
        maven 'Maven 3.9.6'
        jdk 'Java 21'
        nodejs 'NodeJS 20'
    }
    
    environment {
        CI = 'true'
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }
        
        stage('Build & Test Backend (Maven)') {
            steps {
                sh './mvnw clean install -DskipTests'
            }
        }
        
        stage('Build Frontend (Vite/React)') {
            steps {
                dir('frontend') {
                    sh 'npm install'
                    sh 'npm run build'
                }
            }
        }
    }
    
    post {
        always {
            echo 'Pipeline finished.'
        }
    }
}
