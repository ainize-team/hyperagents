# MCP 서버 사용법

1. 원하는 서버의 디렉토리에 접속한다

2. env sample 파일을 참고하여 .env 파일을 생성한다

   - 없으면 생략

3. npm run build

4. 생성된 build/index.js 파일 경로를 agent config file 의 serverScriptPath 에 추가한다

5. 필요한 환경변수를 프로젝트 env 파일에 추가한다.
