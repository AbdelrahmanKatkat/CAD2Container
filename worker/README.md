# CAD2SW.Worker (UNTESTED SKELETON)

Not compiled or run: this machine has no SolidWorks and no .NET SDK.
Build on a machine with SolidWorks installed:
1. Install .NET SDK 8 and SolidWorks; adjust the two SolidWorks interop DLL paths in `CAD2SW.Worker.csproj`
   (`<SW>\api\redist\SolidWorks.Interop.sldworks.dll` and `...swconst.dll`).
2. `dotnet run -- <project.json> <templates_dir> <output_dir>`

Behaviour: for each part with status ready_for_review, copy the template (never edits the master),
set each parameter by its named dimension (`Param@Sketch/Feature`), rebuild, report errors, SaveAs to
`<output_dir>/parts/<id>.SLDPRT`, and write `<output_dir>/result.json`.
The named-dimension mapping must come from your real templates (step 5), nothing here is guessed.
