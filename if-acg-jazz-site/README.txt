If? ACG in Jazz — website folder (for i6 or any web server)
===========================================================

WHAT'S IN HERE
  index.html      the whole website (design, player, your album/song data)
  media/audio/    your songs (the Studio puts them here)
  media/covers/   album covers (the Studio puts them here)
  studio.html     shortcut that opens the editor (index.html#studio)

EDIT ON YOUR COMPUTER (Chrome or Edge recommended)
  1. Keep this folder somewhere safe — it is your master copy.
  2. Double-click studio.html (or open index.html and add #studio to the address).
  3. Click "Open site folder" and choose THIS folder. Allow editing when Chrome asks.
  4. Add albums, covers and songs; write About text, lyrics and tags (Band / Anime / Games + your own).
     - MP3 files are kept as they are. WAV / FLAC / M4A / OGG are converted to WebM (Opus) so each stays under 25 MB.
  5. Click "Save to folder". This writes the new songs/covers into media/ and updates index.html.
  6. Preview: double-click index.html — it plays straight from your computer.
  Safari / Firefox can't write to folders: use "Export site.zip" instead and unzip it over this folder.
  "Delete unused files" (bottom of the Studio) removes old/replaced songs from the folder.

UPLOAD TO i6
  Upload everything in this folder (index.html, studio.html, media/ with all subfolders) to your site's web root,
  replacing the old files. Each time you change something, re-upload index.html plus any new files in media/.
  (If you'd rather not expose the editor, you can skip uploading studio.html — the editor only edits files on
  the visitor's own computer anyway, it can never change your server.)

TIPS
  - If friends in mainland China will visit, a server in Hong Kong / Asia loads much faster than one in the US/EU.
  - The page tries to load Google Fonts; if that's blocked it quietly uses system fonts.
  - Server MIME types: .webm should be served as video/webm or audio/webm, .mp3 as audio/mpeg (most servers already do).

-----------------------------------------------------------
中文说明
  在电脑上编辑：用 Chrome 或 Edge 双击 studio.html → 点「打开网站文件夹」选择本文件夹（允许编辑）→
  添加专辑、封面、歌曲、介绍、歌词、标签 → 点「保存到文件夹」。歌曲会存到 media/audio，封面存到 media/covers，
  index.html 会自动更新。双击 index.html 即可在本地预览。
  上传到 i6：把整个文件夹（index.html、studio.html、media 及其子文件夹）上传到网站根目录并覆盖旧文件。
  以后每次修改，重新上传 index.html 和 media 里新增的文件即可。
  Safari / Firefox 不能直接写入文件夹，请用「导出 site.zip」后解压覆盖本文件夹。
