; Custom code to create AppData folder on install
!macro customInstall
  SetShellVarContext current
  StrCpy $0 "$APPDATA\Mr. DIY - LOCAL\data"
  
  ; Create the data folder if it doesn't exist
  IfFileExists "$0" skip_create
    CreateDirectory "$0"
    DetailPrint "Created data folder: $0"
  
  skip_create:
!macroend

; Custom code to delete AppData on uninstall
!macro customUninstall
  SetShellVarContext current
  StrCpy $0 "$APPDATA\Mr. DIY - LOCAL"
  
  ; Check if folder exists and delete it
  IfFileExists "$0\*.*" 0 skip_delete
    MessageBox MB_YESNO "Do you want to remove all application data and settings?$\n$\nFolder: $0" IDNO skip_delete
    RMDir /r "$0"
    DetailPrint "Application data removed: $0"
  
  skip_delete:
!macroend
