pipeline {
  agent any

  environment {
    PROJECT_NAME = 'testconn'
    ENVIRONMENT  = 'dev'
    PORT         = '3001'
    DEPLOY_PATH  = "/var/www/html/${PROJECT_NAME}/${ENVIRONMENT}"
    LOGS_PATH    = "/var/log/${PROJECT_NAME}/${ENVIRONMENT}"
    NODE_ENV     = 'production'
  }

  stages {

    stage('Checkout') {
      steps {
        checkout scm
        sh 'echo "Workspace:"; pwd; ls -la'
      }
    }

    stage('Install (workspace)') {
      steps {
        sh '''
          node -v
          npm -v
          npm ci
        '''
      }
    }

    stage('Test (workspace)') {
      steps {
        sh 'npm test'
      }
    }

    stage('Package (workspace)') {
      steps {
        sh '''
          echo "📦 Empaquetando artifact..."
          rm -f artifact.tgz
          tar -czf artifact.tgz \
            server.js package.json package-lock.json \
            public
          ls -lh artifact.tgz
        '''
      }
    }

    stage('Deploy (no sudo)') {
      steps {
        sh """
          set -e

          echo "📁 Verificando rutas destino..."
          test -d "${DEPLOY_PATH}" || { echo "❌ No existe DEPLOY_PATH: ${DEPLOY_PATH}"; exit 1; }
          test -d "${LOGS_PATH}"   || { echo "❌ No existe LOGS_PATH: ${LOGS_PATH}"; exit 1; }

          echo "🧹 Limpiando deploy path..."
          rm -rf ${DEPLOY_PATH}/*

          echo "🚚 Desempaquetando artifact en ${DEPLOY_PATH}..."
          tar -xzf artifact.tgz -C ${DEPLOY_PATH}

          echo "📦 Instalando dependencias en destino (prod)..."
          cd ${DEPLOY_PATH}
          npm ci --omit=dev

          echo "🧾 Asegurando PORT=${PORT} en .env (sin secretos)..."
          if [ -f ".env" ]; then
            grep -q '^PORT=' .env && sed -i 's/^PORT=.*/PORT=${PORT}/' .env || echo "PORT=${PORT}" >> .env
          else
            echo "PORT=${PORT}" > .env
          fi

          echo "✅ Deploy listo. Listado:"
          ls -la ${DEPLOY_PATH}
        """
      }
    }

    stage('Healthcheck (si ya está corriendo)') {
      steps {
        sh """
          set +e
          echo "🩺 Healthcheck: http://127.0.0.1:${PORT}/health"
          curl -sf http://127.0.0.1:${PORT}/health
          if [ \$? -ne 0 ]; then
            echo "ℹ️ No respondió el healthcheck. (Aún no hay servicio arrancado/reiniciado)"
            exit 0
          fi
          echo ""
          echo "✅ Healthcheck OK"
        """
      }
    }
  }

  post {
    success {
      echo "🎉 Deploy OK: ${DEPLOY_PATH} (puerto ${PORT})"
      echo "📝 Logs: ${LOGS_PATH}"
    }
    failure {
      echo "❌ Pipeline falló"
      sh """
        echo "Últimos archivos en deploy path (si existen):"
        ls -la ${DEPLOY_PATH} 2>/dev/null || true
      """
    }
    always {
      cleanWs()
    }
  }
}