import { tokenizeGenerator, GeneratorSegment } from './generatorTokenizer';
import { tokenToJs } from './tokenToJs';

// Get all nodes that are not scopes, and save scopes into their own collection
export function separateNodes (allNodes: NodeCollection): {
        uncalculatedNodes: NodeCollection, 
        allScopes: NodeCollection,
        uiNodes: NodeCollection,
        fftNodes: NodeCollection,
        time: NodeCollection,
        animationNodes: NodeCollection,
        filterNodes: NodeCollection,
        derivativeNodes: NodeCollection,
        integralNodes: NodeCollection,
        reverseNodes: NodeCollection
    } {
    let uncalculated: NodeCollection = {};
    let scopes: NodeCollection = {};
    let uiNodes: NodeCollection = {};
    let fftNodes: NodeCollection = {};
    let timeNodes: NodeCollection = {};
    let animationNodes: NodeCollection = {};
    let filterNodes: NodeCollection = {};
    let derivativeNodes: NodeCollection = {};
    let integralNodes: NodeCollection = {};
    let reverseNodes: NodeCollection = {};

    for(let i in allNodes) {
        // Check if it is a UI node
        const isThirdLetterUpperCase = String(i).substr(2, 1).toUpperCase() === String(i).substr(2, 1);
        const isUI = String(i).substr(0, 2) === "ui";
        const isActualUI = isUI && isThirdLetterUpperCase;

        // Check if it is a scope
        const isScope = String(i).substr(0, 5) === "scope";

        // Check if it is an fft scope
        const isFFT = String(i).substr(0, 3) === "fft";

        // Check if it is a time node
        const isTime = String(i).substr(0, 4) === "time";

        // CHeck if it is an animation node
        const isAnimation = String(i).substr(0, 9) === "animation";

        // Check if it is a filter node
        const isFilter = String(i).substr(0, 6) === "filter";

        // Check if it is a derivative node
        const isDerivative = String(i).substr(0, 10) === "derivative";

        // Chech if it is an integral node
        const isIntegral = String(i).substr(0, 8) === "integral";

        // Check if it is reverse node
        const isReverse = String(i).substr(0, 7) === "reverse";

        // Do separation
        if(isScope) {
            scopes[i] = allNodes[i];
        } else if(isActualUI) {
            uiNodes[i] = allNodes[i];
        } else if(isFFT) {
            fftNodes[i] = allNodes[i];
        } else if(isTime) {
            timeNodes[i] = allNodes[i];
        } else if(isAnimation) {
            animationNodes[i] = allNodes[i];
        } else if (isFilter) {
            filterNodes[i] = allNodes[i];
        } else if (isDerivative) {
            derivativeNodes[i] = allNodes[i];
        } else if (isIntegral) {
            integralNodes[i] = allNodes[i];
        } else if (isReverse) {
            reverseNodes[i] = allNodes[i];
        } else {
            uncalculated[i] = allNodes[i];
        }
    }

    // return results
    return {
        uncalculatedNodes: uncalculated,
        allScopes: scopes,
        uiNodes: uiNodes,
        fftNodes: fftNodes,
        time: timeNodes,
        animationNodes: animationNodes,
        filterNodes: filterNodes,
        derivativeNodes: derivativeNodes,
        integralNodes: integralNodes,
        reverseNodes: reverseNodes
    };
}

// Generate connection dictionary
export function generateConnectionDictionary (allConnections: Connector[]): {[connectorStart: string]: string} {
    let connectionDictionary: {[connectorStart: string]: string} = {};

    for(let i = 0; i < allConnections.length; i++) {
        const connectorStart = allConnections[i].connectorStart;
        const connectorEnd = allConnections[i].connectorEnd;

        const connectorStartCombined = connectorStart.nodeId + ":" + connectorStart.settingId;
        const connectorEndCombined = connectorEnd.nodeId + ":" + connectorEnd.settingId;

        connectionDictionary[connectorStartCombined] = connectorEndCombined;
    }

    return connectionDictionary;
}

// Calculate object size
export function objectSize (obj: object): number {
    let c = 0;
    for(let i in obj) c++;
    return c++;
}

// Check if node was calculated already
export function wasCalculated(calculatedNodes: string[], nodeKey: string, outputKey: string): boolean {
    for(let i = 0; i < calculatedNodes.length; i++) {
        // Split string from calculated nodes array and get node and output keys
        const splitted = calculatedNodes[i].split(":");
        const calculatedNode = splitted[0];
        const calculatedOutput = splitted[1];

        if(calculatedNode === nodeKey && calculatedOutput === outputKey) return true;
    }

    return false;
}

// Get nodeId and settingId of the other side of the connection:
export function getOtherSideOfConnector(
    allConnections: Connector[], 
    connectorInput?: {nodeId: string, settingId: string},
    connectorOutput?: {nodeId: string, settingId: string}): {otherNodeId: string, otherSettingId: string} {

    if(connectorInput) {
        // console.log("Scanning connector starts...");

        for(let i = 0; i < allConnections.length; i++) {
            const connector = allConnections[i];
    
            // Check if connector start
            if(connector.connectorStart.nodeId === connectorInput.nodeId) {
                if(connector.connectorStart.settingId === connectorInput.settingId) {
                    return {
                        otherNodeId: connector.connectorEnd.nodeId,
                        otherSettingId: connector.connectorEnd.settingId
                    }
                }
            }
        }
    } else if (connectorOutput) {
        // console.log("Scanning connector ends... ", allConnections.length);
        
        for(let i = 0; i < allConnections.length; i++) {
            const connector = allConnections[i];
            
            // console.log("Comparing following connectors: ", connector.connectorEnd, connectorOutput)
    
            // Check if connector end
            if(connector.connectorEnd.nodeId === connectorOutput.nodeId) {
                if(connector.connectorEnd.settingId === connectorOutput.settingId) {
                    return {
                        otherNodeId: connector.connectorStart.nodeId,
                        otherSettingId: connector.connectorStart.settingId
                    }
                }
            }
        }
    }

    return {
        otherNodeId: null,
        otherSettingId: null
    }
}

// Check if all connected inputs in the node are connected to the outputs that were already calculated or are not connected
export function allInputsCalculated(nodeId: string, inputs: NodeInputShape[], allConnections: Connector[], calculatedNodes: string[]): boolean {
    let data: boolean[] = [];

    for(let i = 0; i < inputs.length; i++) {
        let currentData = false;

        const {otherNodeId, otherSettingId} = getOtherSideOfConnector(allConnections, null, {nodeId: nodeId, settingId: inputs[i].title});

        // If the input is connected
        if(otherNodeId && otherSettingId) {
            // Check if was calculated
            if(wasCalculated(calculatedNodes, otherNodeId, otherSettingId)) {
                currentData = true;
            }
        } else {
            // If the input is not connected
            currentData = true;
        }

        data.push(currentData);
    }

    for(let d in data) {
        if(!data[d]) return false;
    }

    return true;
}

// Function to calculate specific output of the node
export function calculateOutput(
    nodeId: string, 
    outputKey: string, 
    currentNode: SignalNode,
    allConnections: Connector[]): { exe: string, wasSuccessful: boolean } {
    
    let e = "";

    const generatorId = isGenerator(currentNode, outputKey);

    // Check if output is a generator
    if(generatorId !== Infinity) {
        const outputGenerator = currentNode.generators[generatorId];

        // Generate tokens
        const tokens = tokenizeGenerator(outputGenerator.value, nodeId);

        // Save variables first
        e += saveVariables(nodeId, currentNode, tokens, allConnections);

        // Save output
        e += tokenToJs(nodeId, outputGenerator.title, tokens);

        return {
            exe: e,
            wasSuccessful: true
        }
    }

    const inputId = isInput(currentNode, outputKey);

    if(inputId !== Infinity) {
        e += saveInputVariable(currentNode, allConnections, nodeId, outputKey, inputId);
        e += `var ${nodeId}${outputKey} = function (time) { return ${nodeId}${currentNode.inputs[inputId].title}};\n`;

        return {
            exe: e,
            wasSuccessful: true
        }
    }

    const settingId = isSetting(currentNode, outputKey);

    if(settingId !== Infinity) {
        e += `var ${nodeId}${outputKey} = function (time) { return ${currentNode.settings[settingId].value}};\n`;

        return {
            exe: e,
            wasSuccessful: true
        }
    }

    return {
        exe: "",
        wasSuccessful: false
    }
}

function saveVariables(nodeKey: string, node: SignalNode, code: GeneratorSegment[], allConnections: Connector[]): string {
    let newExecutable = "";

    for(let s = 0; s < code.length; s++) {
        if(code[s].type === "var") {
            const varName: string = String(code[s].value);
            const variableName = varName.substr(nodeKey.length, varName.length);

            // -------------------- IF SPECIAL CASE ---------------------
            if(varName === "PI" || varName === "time") continue;
            
            // ----------------------- IF INPUT -------------------------
            // Get input index
            let inputKey: number = isInput(node, variableName);

            // If variable is the input (if not input it will be Infinity)
            if(inputKey !== Infinity) {
                // Save
                newExecutable += saveInputVariable(node, allConnections, nodeKey, variableName, inputKey);

                // console.log(`Found variable in inputs ${variableName} - ${nodeKey}`);

                // And continue to the next step in the tokenised generator code
                continue;
            }

            // ----------------------- IF GENERATOR -------------------------
            // Get generator index
            let generatorKey: number = isGenerator(node, variableName);

            // If generator index is not an Infinity, the setting is the generator, and should be processed as one
            if(generatorKey !== Infinity) {
                const generator = node.generators[generatorKey];

                const tokens = tokenizeGenerator(generator.value, nodeKey);

                newExecutable += saveVariables(nodeKey, node, tokens, allConnections);

                // Save the generator title
                newExecutable += tokenToJs(nodeKey, generator.title, tokens);
            
                // console.log(`Found variable in generators ${variableName} - ${nodeKey}`);

                // Continue to the next token
                continue;
            }

            // ----------------------- IF SETTING -------------------------
            // Get setting index
            let settingKey: number = isSetting(node, variableName);

            // If setting index is not infinity - it's a match!
            if(settingKey !== Infinity) {
                // console.log(`Found variable in settings ${variableName} - ${nodeKey}`);
                newExecutable += `var ${nodeKey}${variableName} = function (time) { return ${node.settings[settingKey].value} };\n`;
                continue;
            }

            // ----------------------- IF NOT ANY OF THREE -------------------------
            // If not one of previous three, alert user.
            newExecutable += `alert("Couldn't find generator variable in the inputs, generators or settings! ${nodeKey} - ${varName}");\n`;
        } else if(code[s].type === "math" || code[s].type === "scope") {
            newExecutable += saveVariables(nodeKey, node, code[s].code, allConnections);
        }
    }

    return newExecutable;
}

function saveInputVariable(node: SignalNode, allConnections: Connector[], nodeKey: string, settingKey: string, index: number): string {
    let newExecutable: string;
    const connectorEnd = {
        nodeId: nodeKey,
        settingId: settingKey
    }
    
    let {otherNodeId, otherSettingId} = getOtherSideOfConnector(allConnections, null, connectorEnd);

    // console.log(`Tracing back the input: ${nodeKey}:${settingKey} -> ${otherNodeId}:${otherSettingId}`);
    
    // If node is connected
    if(otherNodeId && otherSettingId) {
        // Save 
        newExecutable = `var ${nodeKey}${settingKey} = function (time) { return ${otherNodeId}${otherSettingId}(time)};\n`;
    } else {
        // Save default value
        newExecutable = `var ${nodeKey}${settingKey} = function (time) { return ${node.inputs[index].default}};\n`
    }

    return newExecutable;
}

function isInput (node: SignalNode, settingKey: string): number {
    // Check if variable is in inputs
    if(node.inputs) {
        for(let i = 0; i < node.inputs.length; i++) {
            // If variable is the input, return true
            if(node.inputs[i].title === settingKey) {
                return i;
            }
        }
    }

    return Infinity;
}

function isGenerator(node: SignalNode, settingKey: string): number {
    // Scan generators
    if(node.generators) {
        if(node.generators.length > 0) {
            for(let g = 0; g < node.generators.length; g++) {
                if(node.generators[g].title === settingKey) {
                    return g;
                }
            }
        }
    }

    return Infinity;
}

function isSetting(node: SignalNode, settingKey: string): number {
    // Scan generators
    if(node.settings) {
        for(let s = 0; s < node.settings.length; s++) {
            if(node.settings[s].title === settingKey) {
                return s;
            }
        }
    }

    return Infinity;
}

export function getTouchInputs(allNodes: NodeCollection): {uncalculatedNodes: NodeCollection, touchNodes: NodeCollection} {
    let newCollection: NodeCollection = {};
    let newTouchCollection: NodeCollection = {};

    for(let n in allNodes) {
        if(n.substr(0, 10) === "touchInput") {
            newTouchCollection[n] = allNodes[n];
        } else {
            newCollection[n] = allNodes[n];
        }
    }

    return {
        uncalculatedNodes: newCollection,
        touchNodes: newTouchCollection
    }
}

export function initTime(start: number, stop: number, step: number) {
    return `let t = (function(){
        let r = [];
        for(let i = ${start}; i < ${stop}; i+=${step}) {
            r.push(i);
        }
        return r;
    })();`
}

export function generateTouchControllers(nodes: NodeCollection): string {
    let e = "";

    for(let i in nodes) {
        const node = nodes[i];

        let sensitivity: NodeSettingsShape;
        let attachedScope: NodeSettingsShape;

        // Separate settings
        for(let s in node.settings) {
            if(node.settings[s].title === "Sensitivity") {
                sensitivity = node.settings[s];
            } else if(node.settings[s].title === "Scope") {
                attachedScope = node.settings[s];
            } else {
                console.error("Touch node is not correctly formatted.")
            }
        }
        
        let offsetScript = `if(!didAttach${i}) {
            document.getElementById("${attachedScope.value}").onmousedown = function (e) {
                window.onmouseup = function () {
                    window.onmouseup = null;
                    window.onmousemove = null;
                }

                window.onmousemove = function (e) {
                    ${i}OffsetXData += e.movementX*${parseFloat(sensitivity.value)};
                    ${i}OffsetYData += e.movementY*${parseFloat(sensitivity.value)};

                    window.update();
                }
            }

            document.getElementById("${attachedScope.value}").ontouchstart = function (e) {
                window.touchLastPositionX = e.touches[0].pageX;
                window.touchLastPositionY= e.touches[0].pageY;

                window.ontouchend = function () {
                    window.ontouchend = null;
                    window.ontouchmove = null;
                }

                window.ontouchmove = function (e) {
                    let movementX = window.touchLastPositionX - e.changedTouches[0].pageX;
                    let movementY = window.touchLastPositionY - e.changedTouches[0].pageY;
                    
                    ${i}OffsetXData += movementX*${parseFloat(sensitivity.value)};
                    ${i}OffsetYData += movementY*${parseFloat(sensitivity.value)};

                    window.update();

                    window.touchLastPositionX = e.changedTouches[0].pageX;
                    window.touchLastPositionY = e.changedTouches[0].pageY;
                }
            };

            didAttach${i}OffsetX = true;
            didAttach${i}OffsetY = true;
        }\n`;

        for(let o in node.outputs) {
            e += `var ${i}${node.outputs[o].title}Data = 1;\n`;
            e += `var didAttach${i} = false;\n`;

            
            e += `var ${i}${node.outputs[o].title} = function(time) { return ${i}${node.outputs[o].title}Data };\n`
        }

        e += offsetScript;
    }

    return e;
}

export function saveAnimation(node: SignalNode, nodeKey: string): string {
    const type = node.settings[2].value;

    switch (type) {
        case "oscillator": {
            return `var ${nodeKey}${node.outputs[0].title} = function() { return Math.sin(Math.PI*2*animationTime*${node.settings[0].value}) + ${node.settings[1].value}};`;
        }

        default: {
            return `var ${nodeKey}${node.outputs[0].title} = function() { return animationTime*(${node.settings[0].value}) + ${node.settings[1].value}};`;
        }
    }
}

export function initAnimationTime(): string {
    return `if(typeof deltaTime == 'undefined') window.deltaTime = 60;
    var animationTime = 0;
    setInterval(function () {
        animationTime += deltaTime/1000;
        update();
    }, deltaTime);`
}

export function setupCustomMath(): string {
    return `Math.__proto__.sqw = function (x) {
        let val = x >= 0 ? ((x/(2*Math.PI))%1) : (((-x-Math.PI)/(2*Math.PI))%1);
        if(val >= 0 && val <= 0.5) {
            return 0.5;
        } else {
            return -0.5;
        }
    };
    Math.__proto__.sinc = function (x) {
        if(x == 0) return 1;
        return Math.sin(x)/x;
    };
    Math.__proto__.pulse = function (x) {
        const xi = x/(2*Math.PI);
        if(xi > 1) return 0;
        if(xi < -1) return 0;
        return 1;
    };
    Math.__proto__.pyramid = function (x) {
        const xi = x/(2*Math.PI);
        let output = 1;
        if(xi > 1) output = 0;
        if(xi < -1) output = 0;
        if(xi > 0) output = 1-xi;
        if(xi < 0) output = 1+xi;
        if(output < 0) output = 0;
        return output;
    };
    Math.__proto__.sawtooth = function (x) {
        if(x < 0) {
            const xi = (x/(2*Math.PI))%1;
            if(xi > 0.5) return -xi-Math.floor(x);
            if(xi < 0.5) return xi-Math.floor(x);
        } else {
            const xi = (-x/(2*Math.PI))%1;
            if(xi > 0.5) return -xi-Math.floor(x);
            if(xi < 0.5) return xi+Math.floor(x);
        }
        return 0;
    };
    Math.__proto__.ramp = function (x) {
        if(x < 0) return 0;
        return x/(2*Math.PI);
    };
    Math.__proto__.step = function (x) {
        if(x < 0) return 0;
        return 1;
    };
    Math.__proto__.noise = function (x) {
        return Math.random();
    };
    document.body.ontouchend = function (e) {
        e.prefentDefault();
    };
    const allInputs = document.getElementsByTagName("input");
    for(let i = 0; i < allInputs.length; i++) {
        let currentInput = allInputs.item(i);
        document.getElementById(currentInput.id).readOnly = false;
    }\n`;
}