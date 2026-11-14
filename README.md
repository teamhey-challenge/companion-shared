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

## 글꼴과 라이선스

글꼴은 Chiron GoRound TC(SIL OFL 1.1)다. 웹은 `packages/tokens/fonts/ChironGoRoundTC-KoreanLatin.woff2`(가변 wght 200–900), 안드로이드는 같은 글꼴에서 굵기 400·500·600·700을 뽑아 한글 2,350자·라틴·기호로 줄인 TTF 4개(`android/src/main/res/font/chiron_goround_tc_*.ttf`)를 쓴다. 라이선스 전문은 `packages/tokens/fonts/ChironGoRoundTC-OFL.txt`와 `android/OFL-ChironGoRoundTC.txt`에 글꼴 옆으로 함께 배포한다. 소비 앱은 앱 안(설정의 오픈소스 고지 등)에도 이 고지를 포함해야 한다. 테마는 라이트 '바다', 다크 '심해'이며 라이트 `bg-page`는 `#F0F8FB`다.

TTF 재생성은 `fontTools`(`instancer` 후 `subset`)로 한다. 한글은 KS X 1001 완성형 2,350자, 라틴 `U+0020–00FF`, 일반 구두점·한글 호환 자모·화살표를 포함한다.

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

테마 토큰 대비는 `packages/tokens/scripts/contrast.test.mjs`가 시험한다.

## 라이선스

코드는 MIT(`LICENSE`). 글꼴 Chiron GoRound TC는 SIL OFL 1.1이며 전문은 글꼴 옆 `*OFL*.txt`에 있다.
