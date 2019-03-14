import {
    separateNodes,
    generateConnectionDictionary,
    objectSize,
    wasCalculated,
    allInputsCalculated,
    calculateOutput,
    getTouchInputs,
    initTime,
    generateTouchControllers,
    getOtherSideOfConnector
} from './scriptGeneratorFunctions';

const SAMPLE_RATE = 512; // Samples per second
const DURATION = 2; // Seconds, ideally should be dividable by 2
const OFFSET = 0; // Which point should be the centre of the scope

export function scriptGenerator(allNodes: NodeCollection, allConnections: Connector[]) {
    // Executable to store generated javascript code. Any initialisation code should be here.
    let exeArray: string[] = [];
    let executable = "var graphs = {};\n";

    // Setup time
    executable += initTime(OFFSET - DURATION / 2, OFFSET + DURATION / 2, 1 / SAMPLE_RATE);

    // Calculated nodes have following shape: "nodeId:outputId"
    let calculatedNodes: string[] = [];

    // Statistics object
    let statistics = {
        loopCounter: 0,
        initialTotalNodes: objectSize(allNodes),
        initialTotalConnectors: allConnections.length,
        startTime: 0,
        endTime: 0
    };

    // Separates uncalculated nodes from scopes and UI at the start.
    let { uncalculatedNodes, allScopes, uiNodes, fftNodes } = separateNodes(allNodes);

    // Separate touch nodes form regular nodes
    let touchNodesSeparated = getTouchInputs(uncalculatedNodes);

    uncalculatedNodes = touchNodesSeparated.uncalculatedNodes;

    // Deal with touch Controls
    let touchNodes = touchNodesSeparated.touchNodes;

    executable += generateTouchControllers(touchNodes);

    for (let t in touchNodes) {
        for (let o in touchNodes[t].outputs) {
            calculatedNodes.push(`${t}:${touchNodes[t].outputs[o].title}`)
        }
    }

    // Connection Dictionary contains connections in key: value format, where
    // both contain nodeId and settingId as strings separated by a colon.
    let connectionDictionary = generateConnectionDictionary(allConnections);

    // General rules for algorithm writing:
    // * use as many functions as possible (in performance bounds)
    // * 

    // 0. Loop through uncalculated nodes and find scopes. Scopes do not have outputs, so no need to find inputs.
    // 0.0 Do it in a function?

    // 1. Loop until all nodes are calculated
    // |   1. Check if node was calculated before, if yes go to next node. (function)
    // |   2. If was not calculated:
    // |   |   1. Check if all connected inputs are connected to the calculated nodes, if not - go to next node. (function)
    // |   |   2. If yes, save all unconnected inputs (value from default value). (function for each save)
    // |   |   3. Check if output is pointing to a generator. (function)
    // |   |   4. If yes, parse generator
    // |   |   |   1. Scan generator and save variables
    // |   |   |   2. If variable is a generator go to step 1.2.4
    // |   |   |   3. Loop until all generators were parsed
    // |   |   | ----------- In following, inputs are checked first since setting can be an input ----------------
    // |   |   5. Check if output is pointing to an input, if yes assign input variable to the output variable
    // |   |   6. Check if output is pointing to a setting, if yes assign constant to the setting
    // 2. For each scope:
    // |   1. Get all inputs and save them in variables (assumed to be calculated since termination condition from step 1 is based on all nodes being calculated.)
    // |   2. Parse first generator and generate scope output variable (making sure that all variables from generator were saved beforehand)
    // |   3. Generate an array of output data based on general (or connected) time array and save it into a variable
    // |   4. Create redraw function, inside that function:
    // |   |   1. Find appropriate canvas node in the dom
    // |   |   2. Get context
    // |   |   3. Repopulate graph array with new graphs.
    // |   5. Create updateData function, inside that function:
    // |   |   1. Loop through graph array and update graphs with new data.


    // 0.0 Loop through all ui nodes and save their output variable names
    for(let nodeKey in uiNodes) {
        // Save current node into a constant
        const currentNode = uiNodes[nodeKey];
        const outputKey = currentNode.outputs[0].title;

        executable += `document.getElementById("${nodeKey}Input").oninput = function (e) {
            ${nodeKey}${outputKey} = function (t) {
                return parseFloat(e.target.value)
            };
            document.getElementById("${nodeKey}Indicator").innerText = e.target.value;
            update();
        };\n`;
        executable += `var ${nodeKey}${outputKey} = function (t) { return ${uiNodes[nodeKey].settings[3].value}};\n`;

        calculatedNodes.push(`${nodeKey}:${outputKey}`);
        
        delete uncalculatedNodes[nodeKey];
    }
    // 1. Loop until all nodes are calculated and count number of iterations for statistics
    for (statistics.loopCounter = 0; objectSize(uncalculatedNodes) > 0; statistics.loopCounter++) {
        
        // Loop through all uncalculated nodes
        for (let nodeKey in uncalculatedNodes) {
            // Save current node into a constant
            const currentNode = uncalculatedNodes[nodeKey];

            // Go to next node if not all connected inputs were calculated already
            if (!allInputsCalculated(nodeKey, currentNode.inputs, allConnections, calculatedNodes)) continue;

            let currentNodeCalculatedOutputs: string[] = [];

            // Loop through every output of the node to calculate them
            for (let o = 0; o < currentNode.outputs.length; o++) {
                const outputKey = currentNode.outputs[o].title;
                // If current output was calculated already, skip to next one
                if (wasCalculated(calculatedNodes, nodeKey, outputKey)) {
                    currentNodeCalculatedOutputs.push(`${nodeKey}:${outputKey}`);
                    continue;
                }

                // If not, calculate it and append to the executable text.
                let { exe, wasSuccessful } = calculateOutput(nodeKey, outputKey, currentNode, allConnections);
                if (wasSuccessful) {
                    executable += exe;

                    calculatedNodes.push(`${nodeKey}:${outputKey}`);
                } else {
                    console.error(`Could not generate output code: ${nodeKey} - ${outputKey} | scriptGenerator.ts`)
                }
            }

            if (currentNodeCalculatedOutputs.length === currentNode.outputs.length) {
                delete uncalculatedNodes[nodeKey];
            }
        }
    }

    // 2. Loop through all scopes and draw graphs

    exeArray.push(executable);
    executable = "";

    executable += "function update() {\n";

    // Loop through time scopes
    for (let s in allScopes) {
        const currentScope = allScopes[s];
        const { otherNodeId, otherSettingId } = getOtherSideOfConnector(allConnections, null, { nodeId: s, settingId: "signal" });

        executable += `
        if(graphs.${s}) {
            let newData = [];
            for(let i = 0; i < t.length; i++) {newData.push(${otherNodeId}${otherSettingId}(t[i]));}
            graphs.${s}.data.datasets[0].data = newData;
            graphs.${s}.update();
        } else {
            let canvasNode = document.getElementById("${s}");

            var viewSize = {
                x: canvasNode.parentNode.offsetWidth,
                y: canvasNode.parentNode.offsetHeight
            }
            
            var w = viewSize.x;
            var h = viewSize.y;
            
            canvasNode.width = w;
            canvasNode.height = h;
            
            var ctx = canvasNode.getContext("2d");

            let data = [];

            for(let i = 0; i < t.length; i++) {
                data.push(${otherNodeId}${otherSettingId}(t[i]));
            }

            var myChart = new Chart(ctx, {
                type: 'line',
                data: {labels: t.map(ti => ti.toFixed(2)),
                    datasets: [
                        {
                            label: "signal",
                            backgroundColor: 'rgba(0, 0, 0, 0)',
                            borderColor: '${currentScope.settings[1].value}',
                            data: data
                        }
                    ]
                }, options: {
                    elements: {
                        line: {
                            tension: 0.4,
                            stepped: false
                        }, point: {
                            radius: 0,
                            hitRadius: 0,
                            hoverRadius: 0
                        }
                    }, animation: {
                        duration: 0
                    }, tooltips: {
                        enabled: false
                    }, legend: {
                        display: false
                    }${currentScope.settings[0].value == "true" ? '' : `, scales: {
                        xAxes: [{
                            ticks: {
                                max: 1,
                                min: -1,
                                stepSize: 0.01
                            }
                        }], yAxes: [{
                            ticks: {
                                max: 2,
                                min: 0,
                                stepSize: 0.5
                            }
                        }]
                    }`}, title: {
                        display: true,
                        text: '${currentScope.title}',
                        position: 'left'
                    }
                }
            });

            graphs.${s} = myChart;
        }`;

        exeArray.push(executable);
        executable = "";
    }

    // Loop through fft scopes
    for(let f in fftNodes) {
        const currentScope = fftNodes[f];
        const { otherNodeId, otherSettingId } = getOtherSideOfConnector(allConnections, null, { nodeId: f, settingId: "signal" });

        executable += `
        if(graphs.${f}) {
            let data = [];
            for(let i = 0; i < t.length; i++) {data.push(${otherNodeId}${otherSettingId}(t[i]));}

            let f = new FFT(data.length);
            let complexOutput = f.createComplexArray();
            f.realTransform(complexOutput, data);
            let realOutput = new Array(data.length);
            realOutput.fill(0);
            f.fromComplexArray(complexOutput, realOutput);

            // realOutput = realOutput.filter((val, i) => i%2 == 0 || i == 0);

            realOutput = realOutput.splice(0, ${currentScope.settings[3].value});
            
            realOutput = realOutput.map(val => val * 2 / data.length);

            graphs.${f}.data.datasets[0].data = realOutput;
            graphs.${f}.update();
        } else {
            let canvasNode = document.getElementById("${f}");

            var viewSize = {
                x: canvasNode.parentNode.offsetWidth,
                y: canvasNode.parentNode.offsetHeight
            }
            
            var w = viewSize.x;
            var h = viewSize.y;
            
            canvasNode.width = w;
            canvasNode.height = h;
            
            var ctx = canvasNode.getContext("2d");

            let data = [];

            for(let i = 0; i < t.length; i++) {
                data.push(${otherNodeId}${otherSettingId}(t[i]));
            }

            let f = new FFT(data.length);
            let complexOutput = f.createComplexArray();
            f.realTransform(complexOutput, data);
            let realOutput = new Array(data.length);
            realOutput.fill(0);
            f.fromComplexArray(complexOutput, realOutput);

            // realOutput = realOutput.filter((val, i) => i%2 == 0 || i == 0);

            realOutput = realOutput.splice(0, ${currentScope.settings[3].value});

            realOutput = realOutput.map(val => val * 2 / data.length);

            var myChart = new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: realOutput.map((val, i) => i),
                    datasets: [
                        {
                            label: "signal",
                            backgroundColor: 'rgba(245, 23, 54, 0.4)',
                            borderColor: 'rgb(0, 0, 0)',
                            data: realOutput
                        }
                    ]
                }, options: {
                    animation: {
                        duration: 0
                    }, tooltips: {
                        enabled: true
                    }, legend: {
                        display: ${currentScope.inputs.length > 1}
                    }, title: {
                        display: true,
                        text: '${currentScope.title}',
                        position: 'left'
                    }
                }
            });

            graphs.${f} = myChart;
        }`;
    }

    executable += "};\n"
    executable += "update();"

    exeArray.push(executable);
    executable = "";

    return exeArray;
}