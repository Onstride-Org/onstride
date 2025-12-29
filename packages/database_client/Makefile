# Makefile
flutter := flutter
# Generate code Shortcuts (Build Mode)
build:
	$(flutter) packages pub run build_runner build -d
watch:
	$(flutter) packages pub run build_runner watch -d
pub_build:
	$(flutter) pub upgrade && $(flutter) pub get && $(flutter) packages pub run build_runner build -d
pub_watch:
	$(flutter) pub upgrade && $(flutter) pub get && $(flutter) packages pub run build_runner watch --delete-conflicting-outputs

