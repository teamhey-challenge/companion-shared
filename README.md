# companion-shared

차량 캐릭터 AI 컴패니언(임시 이름 `companion-*`)의 공유 저장소다. 디자인 토큰 파이프라인과 Android Compose 토큰 라이브러리를 담는다. HEY 시절 `hey-shared`에서 `packages/tokens`·`android`만 기록째 떼어 왔다.

## 구성

| 위치 | 내용 |
|---|---|
| `packages/tokens` | 디자인 토큰 정본 `hey.tokens.json`, 생성기 `build.mjs`, 생성물 `dist/tokens.{css,ts}`, CSS 리터럴 검사 |
| `packages/protocol` | 빈 패키지. 컴패니언 메시지·프로토콜 타입을 새로 쓴다 |
| `packages/copy` | 빈 패키지. 컴패니언 문구 카탈로그를 새로 쓴다 |
| `android/` | Gradle 라이브러리 `ai.hey:tokens-compose` (`HeyTokens.kt`, 차량 앱이 아직 쓰는 `ProtocolVersion.kt`) |

패키지·Kotlin 이름(`hey-*`, `ai.hey.*`)은 앱 이름이 확정될 때까지 바꾸지 않는다.

## 소비 방식

레지스트리 게시 없이 소비 저장소(`companion-server`, `companion-web`, `companion-car`, `companion-e2e`)가 이 저장소를 git 서브모듈 `shared/`로 두고 태그에 고정한다. 태그는 `v0.1.0`부터 새로 시작한다.

```sh
git submodule add git@github.com:darren-pleos-challenge/companion-shared.git shared
git -C shared checkout v0.1.0
```

- JS: `"@darren-pleos-challenge/hey-tokens": "file:shared/packages/tokens"`
- Android: `settings.gradle.kts`에 `includeBuild("shared/android")`

## 로컬 점검

CI는 두지 않는다.

```sh
bun install
bun run check          # 토큰 시험 + 생성물이 최신인지
cd android && nice -n 19 ./gradlew --max-workers=2 :assembleRelease
```
