# Makefile
flutter := flutter
# Generate code Shortcuts (Build Mode)
.PHONY: build

build:
	$(flutter) packages pub run build_runner build -d
watch:
	$(flutter) packages pub run build_runner watch -d
pub_build:
	$(flutter) pub upgrade && $(flutter) pub get && $(flutter) packages pub run build_runner build -d
pub_watch:
	$(flutter) pub upgrade && $(flutter) pub get && $(flutter) packages pub run build_runner watch --delete-conflicting-outputs
build_models:
	cd packages/models && $(flutter) packages pub run build_runner build -d
watch_models:
	cd packages/models && $(flutter) packages pub run build_runner watch -d

# App Bundle Generator Shortcuts
gen_aab_dev:
	$(flutter) build appbundle --flavor dev -t lib/main_dev.dart
gen_aab_prod:
	$(flutter) build appbundle --flavor prod -t lib/main_prod.dart
open_aab:
	open build/app/outputs/bundle/

# APK Generator Shortcuts
DATE := $(shell date +%d-%m-%Y)
flutter := flutter

gen_apk_dev:
	$(flutter) build apk --flavor dev -t lib/main_dev.dart
	mv build/app/outputs/flutter-apk/app-dev-release.apk build/app/outputs/flutter-apk/gl_horses_dev-$(DATE).apk

gen_apk_prod:
	$(flutter) build apk --flavor prod -t lib/main_prod.dart
	mv build/app/outputs/flutter-apk/app-prod-release.apk build/app/outputs/flutter-apk/gl_horses_prod-$(DATE).apk
open_apk:
	open build/app/outputs/flutter-apk/

# Build Web Shortcuts
gen_web_dev:
	$(flutter) build web -t lib/main_dev.dart
gen_web_prod:
	$(flutter) build web -t lib/main_prod.dart
run_web_dev:
	$(flutter) run -d chrome -t lib/main_dev.dart
run_web_prod:
	$(flutter) run -d chrome -t lib/main_prod.dart
open_web:
	open build/web/

# Build iOS Shortcuts
gen_ios_dev:
	$(flutter) build ios --flavor dev -t lib/main_dev.dart
gen_ios_prod:
	$(flutter) build ios --flavor prod -t lib/main_prod.dart
open_ios:
	open build/ios/

# Build IPA Shortcuts
gen_ipa_dev:
	$(flutter) build ipa --flavor dev -t lib/main_dev.dart
gen_ipa_prod:
	$(flutter) build ipa --flavor prod -t lib/main_prod.dart
open_ipa:
	open build/ios/ipa/

# Help Shortcuts
fix_and_delete_pods:
	rm -rf ios/Pods ios/Podfile.lock && cd ios && pod repo update && pod update && pod install
fix_pods:
	cd ios && pod repo update && pod update && pod install

install_pods:
	cd ios && pod install
gen_icon:
	$(flutter) pub get && $(flutter) pub run flutter_launcher_icons
clean:
	$(flutter) clean
gen_l10n:
	$(flutter) gen-l10n

deploy_cloud_functions_dev:
	cd functions/dev && firebase use dev && firebase deploy --only functions:dev-functions

deploy_cloud_functions_prod:
	cd functions/prod && firebase use prod && firebase deploy --only functions:prod-functions

.PHONY: upgrade_all

upgrade_all:
	@echo "🔄 Running 'dart pub upgrade' in all packages..."
	@find packages -type f -name "pubspec.yaml" -execdir sh -c 'echo "📦 Upgrading $$(basename $$(pwd))"; dart pub upgrade' \;
	@echo "✅ Upgrade complete!"


build_runner_all:
	@echo "🔄 Running 'dart run build_runner build -d' in all packages..."
	@find packages -type f -name "build.yaml" -execdir sh -c '\
		echo "\n📦 Building in $$(basename $$(pwd))..."; \
		dart run build_runner build -d || echo "❌ Failed in $$(pwd)"; \
	' \;
	@echo "\n✅ Build Runner complete!"

#---------------------------------------------------------------------------------------------------
# FIREBASE PROJECT CONFIGURATION SHORTCUTS
#---------------------------------------------------------------------------------------------------

# -> Variables <-
APP_ID ?= com.smartup.glhorses
PLATFORM_IOS ?= $(APP_ID)
PLATFORM_ANDROID ?= $(APP_ID)
FLAVOR ?= dev
PROJECT_ID ?= gl-horses-dev
OUTPUT ?= lib/firebase/firebase_options_$(FLAVOR).dart
PLIST_DEST ?= ios/config/$(FLAVOR)/GoogleService-Info.plist

# -> Base command <-
define FLUTTERFIRE_CMD
flutterfire configure \
	--ios $(PLATFORM_IOS) \
	--android $(PLATFORM_ANDROID) \
	--project $(PROJECT_ID) \
	--out=$(OUTPUT) \
	--ios-bundle-id=$(PLATFORM_IOS) \
	--plist-file=$(PLIST_DEST)
endef


add_firebase:
	flutterfire configure --project gl-horses-prod --out lib/firebase_options_prod.dart --ios-bundle-id com.smartup.glhorses --android-package-name com.smartup.gl_horses

add_firebase_dev:
	$(MAKE) add_firebase FLAVOR=dev PROJECT_ID=gl-horses-dev

add_firebase_stg:
	$(MAKE) add_firebase FLAVOR=stg PROJECT_ID=gl-horses-stg

add_firebase_prod:
	$(MAKE) add_firebase FLAVOR=prod PROJECT_ID=gl-horses-prod

keystoreFile := ~/.keystores/gl-horses-release-key.jks
keystoreArgs := -alias glhorses_key
gen_debug_sha1:
	cd android && keytool -list -v -keystore ~/.android/debug.keystore -alias androiddebugkey -storepass android -keypass android
gen_debug_sha1_base64:
	cd android && keytool -exportcert -alias androiddebugkey  -keystore  ~/.android/debug.keystore -storepass android -keypass android | openssl sha1 -binary | openssl base64
gen_release_sha1:
	cd android && keytool -list -v -keystore $(keystoreFile) $(keystoreArgs)
gen_release_sha1_base64:
	cd android && keytool -exportcert -keystore $(keystoreFile) $(keystoreArgs) | openssl sha1 -binary | openssl base64
migrate_to_PKCS12:
	cd android && keytool -importkeystore -srckeystore $(keystoreFile) -destkeystore $(keystoreFile) -deststoretype pkcs12
migrate_debug_to_PKCS12:
	cd android && keytool -importkeystore -srckeystore ~/.android/debug.keystore -destkeystore ~/.android/debug.keystore -deststoretype pkcs12