/*
 * gen_removebg.jsx — batch background removal for the pose/idle PNGs
 * Photoshop 2025/2026 (uses AI "Select Subject" + layer mask).
 *
 * Runs INSIDE Photoshop on YOUR machine. It walks the episode characters'
 * appearances folders, removes the white studio background from every PNG,
 * and saves a transparent PNG over the original (the untouched original is
 * copied to appearances/_opaque_backup/ first).
 *
 * HOW TO RUN
 *   A) Photoshop → File → Scripts → Browse… → pick this file.
 *   B) Terminal (macOS):
 *        osascript -e 'tell application "Adobe Photoshop 2026" to do javascript (read (POSIX file "/FULL/PATH/roles-ai/gen_removebg.jsx"))'
 *   C) Terminal (launch PS with the script):
 *        open -a "Adobe Photoshop 2026" "/FULL/PATH/roles-ai/gen_removebg.jsx"
 *
 * Assumes this .jsx sits in the repo root (…/roles-ai). If you move it,
 * set REPO_ROOT below by hand.
 */

#target photoshop

// ---- config ---------------------------------------------------------------
var SCRIPT_FILE = new File($.fileName);
var REPO_ROOT   = SCRIPT_FILE.parent;                 // …/roles-ai  (edit if needed)
var CHARS_DIR   = new Folder(REPO_ROOT.fsName + "/worlds/pride-and-prejudice/characters");
var CHARACTERS  = ["sir_ashbourne", "mrs_frost", "arabella_frost", "mr_frost", "the_maid"];
var SKIP_ALREADY_TRANSPARENT = true;   // skip files that already look cut out

// ---------------------------------------------------------------------------
function log(s){ $.writeln(s); }

function convertBgToLayer(doc){
  try { if (doc.activeLayer.isBackgroundLayer) doc.activeLayer.isBackgroundLayer = false; } catch(e){}
}

var FIRST_ERR = "";
function selectSubject(){
  // AI "Select Subject" — try a few known call signatures across PS versions
  var attempts = [
    function(){ executeAction(stringIDToTypeID("selectSubject"), new ActionDescriptor(), DialogModes.NO); },
    function(){ executeAction(stringIDToTypeID("selectSubject"), undefined, DialogModes.NO); },
    function(){ var d=new ActionDescriptor(); d.putBoolean(stringIDToTypeID("sampleAllLayers"), false);
                executeAction(stringIDToTypeID("selectSubject"), d, DialogModes.NO); },
    function(){ executeAction(stringIDToTypeID("autoCutout"), new ActionDescriptor(), DialogModes.NO); }
  ];
  for (var a=0; a<attempts.length; a++){
    try { attempts[a](); return true; } catch(e){ if(!FIRST_ERR) FIRST_ERR = "selectSubject: " + e; }
  }
  return false;
}

function addMaskRevealSelection(){
  // Layer > Layer Mask > Reveal Selection
  var d = new ActionDescriptor();
  d.putClass(charIDToTypeID("Nw  "), charIDToTypeID("Chnl"));
  var r = new ActionReference();
  r.putEnumerated(charIDToTypeID("Chnl"), charIDToTypeID("Chnl"), charIDToTypeID("Msk "));
  d.putReference(charIDToTypeID("At  "), r);
  d.putEnumerated(charIDToTypeID("Usng"), charIDToTypeID("UsrM"), charIDToTypeID("RvlS"));
  executeAction(charIDToTypeID("Mk  "), d, DialogModes.NO);
}

function looksTransparent(doc){
  // heuristic: if the layer already has transparency (no locked background), skip
  try { return !doc.activeLayer.isBackgroundLayer && doc.layers.length === 1 && doc.activeLayer.kind === LayerKind.NORMAL && hasAlphaEdge(doc); }
  catch(e){ return false; }
}
function hasAlphaEdge(doc){
  // cheap check: sample the top-left pixel's transparency via histogram is hard;
  // instead just check there is NO background layer — good enough as a guard.
  try { return !doc.backgroundLayer; } catch(e){ return false; }
}

function savePNG(doc, file){
  var o = new PNGSaveOptions();
  o.compression = 6; o.interlaced = false;
  doc.saveAs(file, o, true, Extension.LOWERCASE);
}

function hasBackgroundLayer(doc){
  try { return doc.backgroundLayer != null; } catch(e){ return false; }
}
function processFile(file, backupFolder){
  var doc;
  try { doc = app.open(file); }
  catch(e){ if(!FIRST_ERR) FIRST_ERR = "open("+file.name+"): " + e; return "fail"; }
  try {
    // skip files that already have transparency (no locked Background layer)
    if (SKIP_ALREADY_TRANSPARENT && !hasBackgroundLayer(doc)) {
      log("  skip (already transparent): " + file.name);
      doc.close(SaveOptions.DONOTSAVECHANGES); return "skip";
    }
    // backup the untouched original once
    if (backupFolder){
      if (!backupFolder.exists) backupFolder.create();
      var bak = new File(backupFolder.fsName + "/" + file.name);
      if (!bak.exists) file.copy(bak);
    }
    convertBgToLayer(doc);
    if (!selectSubject()) { doc.close(SaveOptions.DONOTSAVECHANGES); return "fail"; }
    addMaskRevealSelection();
    try { doc.selection.deselect(); } catch(e){}
    savePNG(doc, file);
    doc.close(SaveOptions.DONOTSAVECHANGES);
    log("  ok: " + file.name);
    return "ok";
  } catch(e){
    if(!FIRST_ERR) FIRST_ERR = "process("+file.name+"): " + e;
    try { doc.close(SaveOptions.DONOTSAVECHANGES); } catch(x){}
    return "fail";
  }
}

function run(){
  if (!CHARS_DIR.exists){ alert("characters dir not found:\n" + CHARS_DIR.fsName); return; }
  var counts = {ok:0, skip:0, fail:0};
  for (var c=0; c<CHARACTERS.length; c++){
    var appDir = new Folder(CHARS_DIR.fsName + "/" + CHARACTERS[c] + "/appearances");
    if (!appDir.exists){ log("no appearances dir: " + CHARACTERS[c]); continue; }
    var backup = new Folder(appDir.fsName + "/_opaque_backup");
    var pngs = appDir.getFiles(function(f){ return (f instanceof File) && /\.png$/i.test(f.name); });
    log("== " + CHARACTERS[c] + " (" + pngs.length + " files) ==");
    for (var i=0; i<pngs.length; i++){
      var r = processFile(pngs[i], backup);
      counts[r]++;
    }
  }
  alert("Remove-background done.\nok: " + counts.ok + "   skipped: " + counts.skip + "   failed: " + counts.fail +
        (FIRST_ERR ? ("\n\nFirst error:\n" + FIRST_ERR) : "") +
        "\n\nOriginals backed up in each appearances/_opaque_backup/.");
}

run();
