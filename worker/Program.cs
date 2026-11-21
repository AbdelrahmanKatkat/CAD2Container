using System.Text.Json;
using System.Text.Json.Nodes;
using SolidWorks.Interop.sldworks;
using SolidWorks.Interop.swconst;

// UNTESTED. Usage: worker <project.json> <templates_dir> <output_dir>
var proj = JsonNode.Parse(File.ReadAllText(args[0]))!;
string tplDir = args[1], outDir = Path.Combine(args[2], "parts");
Directory.CreateDirectory(outDir);

var swType = Type.GetTypeFromProgID("SldWorks.Application")
    ?? throw new Exception("SolidWorks not installed / not registered.");
var sw = (SldWorks)Activator.CreateInstance(swType)!;
sw.Visible = false;
var results = new JsonArray();

foreach (var part in proj["parts"]!.AsArray())
{
    string id = part!["id"]!.GetValue<string>();
    var r = new JsonObject { ["id"] = id };
    try
    {
        string tpl = Path.Combine(tplDir, part["template"]!["id"]!.GetValue<string>() + ".SLDPRT");
        string dst = Path.Combine(outDir, id + ".SLDPRT");
        File.Copy(tpl, dst, true);                       // never touch the master template
        int err = 0, warn = 0;
        var model = (ModelDoc2)sw.OpenDoc6(dst, (int)swDocumentTypes_e.swDocPART,
            (int)swOpenDocOptions_e.swOpenDocOptions_Silent, "", ref err, ref warn);
        if (model == null) throw new Exception($"OpenDoc6 failed err={err}");

        foreach (var p in part["parameters"]!.AsArray())
        {
            if (p!["value"] is not JsonValue v || !v.TryGetValue<double>(out var mm)) continue;
            // Named dimension, e.g. "louver_width@Sketch1". Name must exist in the template.
            var dim = (Dimension)model.Parameter(p["name"]!.GetValue<string>());
            if (dim == null) throw new Exception($"Dimension not found: {p["name"]}");
            dim.SystemValue = mm / 1000.0;                // SolidWorks API uses metres
        }
        bool ok = model.EditRebuild3();
        bool saved = model.Extension.SaveAs3(dst, 0, (int)swSaveAsOptions_e.swSaveAsOptions_Silent,
            null, null, ref err, ref warn) == true;
        r["rebuild_ok"] = ok; r["saved"] = saved; r["file"] = dst;
        sw.CloseDoc(model.GetTitle());
    }
    catch (Exception e) { r["error"] = e.Message; }
    results.Add(r);
}
File.WriteAllText(Path.Combine(args[2], "result.json"),
    new JsonObject { ["results"] = results }.ToJsonString(new JsonSerializerOptions { WriteIndented = true }));
sw.ExitApp();
