import { spawn } from "child_process";
import * as path from "path";

interface PlotOptions {
    x: number[];
    y: number[];
    title?: string;
    xlabel?: string;
    ylabel?: string;
    output?: string;
}

export function createPlot({
    x,
    y,
    title = "NPC Ship Path",
    xlabel = "X",
    ylabel = "Y",
    output = "path.png",
}: PlotOptions): Promise<string> {
    return new Promise((resolve, reject) => {
        const payload = JSON.stringify({ x, y, title, xlabel, ylabel, output });


        const python = spawn("python3", [path.join(__dirname, "path-checker.py")]);

        let stdout = "";
        let stderr = "";

        python.stdout.on("data", (data: Buffer) => { stdout += data.toString(); });
        python.stderr.on("data", (data: Buffer) => { stderr += data.toString(); });

        python.on("close", (code: number | null) => {
            if (code !== 0) {
                reject(new Error(`path-checker.py exited with code ${code}\n${stderr}`));
            } else {
                resolve(stdout.trim());
            }
        });

        python.on("error", reject);

        python.stdout.on("data", (data: Buffer) => process.stdout.write(`[Python] ${data.toString()}`));
        python.stderr.on("data", (data: Buffer) => process.stderr.write(`[Python] ${data.toString()}`))
        python.stdin.write(payload);
        python.stdin.end();
    });
}