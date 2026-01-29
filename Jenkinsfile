pipeline {
  agent any

  environment {
    NODE_ENV = "production"
  }

  stages {
    stage("Install dependencies") {
      steps {
        sh "npm ci"
      }
    }

    stage("Run tests") {
      steps {
        sh "npm test"
      }
    }

    stage("Prepare artifact") {
      steps {
        sh "echo 'Listando archivos para empaquetar'; ls -la"
      }
    }

    stage("Package + deploy hint") {
      steps {
        sh '''
          echo "Aquí puedes empaquetar el proyecto (tar, zip, etc.)"
          echo "y/o transferirlo al servidor AMI según tu flujo."
        '''
      }
    }
  }

  post {
    always {
      sh "echo 'Pipeline completada'"
    }
  }
}
