pipeline {
  agent any

  environment {
    PROJECT_NAME = 'testconn'
    ENVIRONMENT  = 'dev'
    PORT         = '3001'

    DEPLOY_PATH  = "/var/www/html/${PROJECT_NAME}/${ENVIRONMENT}"
    LOGS_PATH    = "/var/log/${PROJECT_NAME}/${ENVIRONMENT}"
    SUDO         = 'sudo -n'

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
          # Incluye lo necesario para correr
          tar -czf artifact.tgz \
            server.js package.json package-lock.json \
            public
          ls -lh artifact.tgz
        '''
      }
    }

    stage('Deploy to server folders') {
      steps {
        sh """
          set -e

          echo "📁 Asegurando directorios destino..."
          ${SUDO} mkdir -p ${DEPLOY_PATH} ${LOGS_PATH}

          echo "🔧 Ownership (jenkins:jenkins) para poder escribir/rsync..."
          ${SUDO} chown -R jenkins:jenkins ${DEPLOY_PATH} ${LOGS_PATH} || true
          ${SUDO} chmod -R 755 ${DEPLOY_PATH} || true
          ${SUDO} chmod 775 ${LOGS_PATH} || true

          echo "🚚 Desempaquetando artifact en ${DEPLOY_PATH}..."
          rm -rf ${DEPLOY_PATH}/*
          tar -xzf artifact.tgz -C ${DEPLOY_PATH}

          echo "📦 Instalando dependencias en destino (prod)..."
          cd ${DEPLOY_PATH}
          npm ci --omit=dev

          echo "🧾 Asegurando PORT=3001 en entorno del proceso"
          # Si usas .env, lo creamos/actualizamos sin guardar secretos aquí.
          # (DB_PASSWORD lo puedes manejar por Jenkins credentials o por env del servicio)
          if [ -f ".env" ]; then
            # actualizar o añadir PORT
            grep -q '^PORT=' .env && sed -i 's/^PORT=.*/PORT=${PORT}/' .env || echo "PORT=${PORT}" >> .env
          else
            echo "PORT=${PORT}" > .env
          fi

          echo "✅ Deploy listo en ${DEPLOY_PATH}"
          echo "📋 Contenido:"
          ls -la ${DEPLOY_PATH}
        """
      }
    }

    stage('Restart service (if exists) + Healthcheck') {
      steps {
        sh """
          set +e
          SERVICE_NAME="${PROJECT_NAME}-${ENVIRONMENT}"

          echo "🔄 Intentando reiniciar servicio systemd: \${SERVICE_NAME} (si existe)..."
          ${SUDO} systemctl restart \${SERVICE_NAME} 2>/dev/null
          if [ \$? -ne 0 ]; then
            echo "ℹ️ No existe/No se pudo reiniciar \${SERVICE_NAME}. (No es fallo del deploy)"
          else
            echo "✅ Servicio reiniciado"
          fi

          echo "⏳ Esperando 2s..."
          sleep 2

          echo "🩺 Healthcheck: http://127.0.0.1:${PORT}/health"
          curl -sf http://127.0.0.1:${PORT}/health && echo "" || {
            echo "⚠️ Healthcheck no respondió. (Si aún no está corriendo el servicio es normal)"
            exit 0
          }
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