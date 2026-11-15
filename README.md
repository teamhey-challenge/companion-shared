# companion-shared

Hey 앱들이 함께 쓰는 디자인 토큰, 글꼴, 프로토콜 타입.

토큰 한 파일(`hey.tokens.json`)에서 웹 CSS·TypeScript 값·Android Compose 코드(`HeyTokens.kt`)를 생성하므로, 차 앱·폰 앱·웹이 같은 색·크기·글꼴을 쓴다. 레지스트리에 게시하지 않고 소비 저장소가 git 서브모듈로 가져간다.

## 구성

| 위치 | 내용 |
|---|---|
| `packages/tokens` | 토큰 정본 `hey.tokens.json`, 생성기 `build.mjs`, 생성물 `dist/tokens.{css,ts}`, 글꼴 `fonts/`, CSS 리터럴·색 대비 시험 |
| `packages/protocol` | 차↔서버 WebSocket 메시지의 TypeScript 타입과 런타임 검증기(`parseClientFrame`/`parseServerFrame`) |
| `packages/copy` | 문구 카탈로그 자리(현재 비어 있음) |
| `android/` | Gradle 라이브러리 `ai.hey:tokens-compose`(`HeyTokens.kt`, 프로토콜 버전 상수, 가변 글꼴) |

테마는 라이트 '바다', 다크 '심해' 두 가지다.

## 글꼴

Chiron GoRound TC(SIL OFL 1.1)를 쓴다. 웹은 `packages/tokens/fonts/ChironGoRoundTC-KoreanLatin.woff2`, 안드로이드는 같은 글꼴의 가변 TTF(`android/src/main/res/font/chiron_goround_tc_variable.ttf`, wght 200–900)다. 라이선스 전문은 글꼴 옆(`ChironGoRoundTC-OFL.txt`, `android/OFL-ChironGoRoundTC.txt`)에 함께 있다. 소비 앱은 앱 안(설정의 오픈소스 고지 등)에도 이 고지를 넣어야 한다.

## 가져다 쓰기

소비 저장소에서 서브모듈로 두고 태그에 고정한다.

```sh
git submodule add git@github.com:teamhey-challenge/companion-shared.git shared
git -C shared checkout v0.5.2
```

- JS/TS: `package.json`에 `"@teamhey/hey-tokens": "file:shared/packages/tokens"`(프로토콜은 `.../hey-protocol`, `file:shared/packages/protocol`)
- CSS: `@teamhey/hey-tokens/tokens.css`
- Android: `settings.gradle.kts`에 `includeBuild("shared/android")`

## 토큰 다시 생성하기

`packages/tokens/hey.tokens.json`을 고친 뒤 생성기를 돌리면 `dist/tokens.css`, `dist/tokens.ts`, `android/src/main/kotlin/ai/hey/designsystem/token/HeyTokens.kt`가 갱신된다. 생성물은 함께 커밋한다.

```sh
bun install
bun run tokens         # 생성
bun run check          # 시험 + 생성물이 최신인지 + 스튜디오 토큰과 일치하는지
```

토큰 값의 정본은 디자인 스튜디오 [`hey-companion-ui`](https://github.com/teamhey-challenge/hey-companion-ui)이고, 이 저장소의 `hey.tokens.json`은 그 사본이다. `bun run check:studio`가 둘을 비교한다(네트워크가 안 되면 건너뛰고, `STUDIO_TOKENS_STRICT=1`이면 실패한다).

Android 라이브러리 빌드:

```sh
cd android && ./gradlew :assembleRelease
```

## 버전

`vMAJOR.MINOR.PATCH` 태그를 쓴다. 토큰 값이나 이름이 바뀌면 PR로 병합한 뒤 태그를 올리고, 소비 저장소에서 서브모듈 포인터를 새 태그로 옮긴다. CI는 `bun run check`를 돌린다.

## 관련 저장소

| 저장소 | 내용 |
|---|---|
| [companion-car](https://github.com/teamhey-challenge/companion-car) | 차량 앱 |
| [companion-phone](https://github.com/teamhey-challenge/companion-phone) | 폰 앱 |
| [companion-server](https://github.com/teamhey-challenge/companion-server) | 대화·기억·TTS 서버 |
| [companion-web](https://github.com/teamhey-challenge/companion-web) | 폰 웹·Storybook |

코드는 MIT 라이선스([`LICENSE`](LICENSE))이고, 글꼴은 SIL OFL 1.1이다.
