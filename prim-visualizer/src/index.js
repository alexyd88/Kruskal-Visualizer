import React, { useState } from "react";
import ReactDOM from 'react-dom/client';
import { useEffect, useRef } from 'react';
import { Network } from 'vis-network/peer';
import { DataSet } from 'vis-data/peer';
import { setTokenSourceMapRange } from "typescript";
import './index.css';
import './navbar';
import ReactGA from 'react-ga4'
import NavBar from "./navbar";

ReactGA.initialize('G-W2K3RBN9YT')

const lightEdgeColor = '#b5b5b5'
const darkEdgeColor = '#333a47'
const visColor = '#f8556e'
const processingColor = '#fae135'
const nodeColor = '#56a5cd'
const startNodeColor = '333a47'
const colors = ['#e6194B', '#3cb44b', '#ffe119', '#4363d8', '#f58231', '#911eb4', '#42d4f4', '#f032e6', '#bfef45', '#fabed4', '#469990', '#dcbeff', '#9A6324', '#fffac8', '#800000', '#aaffc3', '#808000', '#ffd8b1', '#000075', '#a9a9a9', '#ffffff', '#000000'];
const INF = 987654321

function display(netNodes, netEdges) {
    document.getElementById('mynetwork').setAttribute("style","width:700px");
    document.getElementById('mynetwork').setAttribute("style","height:600px");
    const data = {
        nodes: netNodes,
        edges: netEdges
    };
    const options = {
        edges: {
            chosen: false
        },
        nodes: {
            chosen: false
        },
        physics: {
            stabilization: false
        }
        /*edges: {
            color: false
        }*/
    };
    let container = document.getElementById("mynetwork");
    const network = new Network(container, data, options);
}

class Edge {
    constructor(to, from, weight, id) {
        this.to = to
        this.from = from
        this.weight = weight
        this.id = id
    }
}

function Graph(props) {
    
    const [nn, setNumNodes] = useState(10);
    const [anc, setAnc] = useState([[]]);
    const [anch, setAnch] = useState([[]]);
    const [vis, setVis] = useState([]);
    const [vish, setVish] = useState([[]]);
    const [adjWeight, setAdjWeight] = useState([[]]);
    const [adjChild, setAdjChild] = useState([[]]);
    const [adjId, setAdjId] = useState([[]]);
    const [netNodes, changeNodes] = useState(new DataSet([]));
    const [netEdges, changeEdges] = useState(new DataSet([]));
    const [edgeh, changeEdgeh] = useState([[]])
    const [step, setStep] = useState(0);
    const [reset, setReset] = useState(1);
    const [potH, setPotH] = useState([[]]);
    const [p, setP] = useState([]);
    const [edges, setEdges] = useState([]);
    const [dist, setDist] = useState([]);
    const [distH, setDistH] = useState([[]]);
    const [pah, setPah] = useState([[]]);
    function refreshData()
    {
        container = document.getElementById('edgetable');
        while(container.firstChild){
            container.removeChild(container.firstChild);
        }
        let header = container.insertRow();
        let t1 = header.insertCell(0);
        let t2 = header.insertCell(1);
        let t3 = header.insertCell(2);
        let t4 = header.insertCell(3);
        t1.innerText = 'TOTAL DISTANCE';
        t2.innerText = 'FROM';
        t3.innerText = 'TO';
        t4.innerText = 'NOTE';
        let ff = false;
    }
    function compareEdge(a, b)
    {
        if (a.weight > b.weight)
            return 1;
        else
            return -1;
    }
    function getPa(a)
    {
        //console.log(a);
        if (p[a] == a)
            return a;
        p[a] = getPa(p[a]);
        return p[a];
    }
    function addEdge(r1, r2, ew, cid)
    {
        adjWeight[r1].push(ew);
        adjChild[r1].push(r2);
        adjWeight[r2].push(ew);
        adjChild[r2].push(r1);
        adjId[r1].push(cid);
        adjId[r2].push(cid);
        edges.push(new Edge(r1, r2, ew, cid));
        p[getPa(r1)] = getPa(r2);
        netEdges.add({
            id: cid,
            from: r1, to :r2, 
            label: ew.toString(),
            color: darkEdgeColor
        });
    }
    let container = document.getElementById("mynetwork");
    useEffect(() => {
        if (reset > 0)
        {
            setStep(0);
            adjWeight.length = 0;
            adjChild.length = 0;
            adjId.length = 0;
            vis.length = 0;
            dist.length = 0;
            for (let i = 0; i < nn; i++) {
                adjWeight.push([]);
                adjChild.push([]);
                adjId.push([]);
                vis.push(false);
            }
            var ids = netNodes.getIds();
            for (let i = 0; i < ids.length; i++)
                netNodes.remove(ids[i]);
            //nodes = new DataSet([]);
            for (let i = 0; i < nn; i++) {
                dist.push(INF)
                netNodes.add({ id: i, label: i.toString()});
                //console.log(i);
            }
            dist[0] = 0;
            distH.length = nn-1;
            distH[0] = [...dist];
            p.length = 0;
            for (let i = 0; i < nn; i++)
                p.push(i);
            
            //edges = new DataSet([]);
            ids = netEdges.getIds();
            for (var i = 0; i < ids.length; i++)
                netEdges.remove(ids[i]);
            let cid = 0;
            let ved = [];
            edges.length = 0;
            for (let i = 0; i < nn*2; i++)
            {
                let r1 = Math.floor(Math.random()*nn);
                let r2 = Math.floor(Math.random()*nn);
                let ew = Math.floor(1+Math.random()*9);
                if (r1 != r2) {
                    addEdge(r1, r2, ew, cid);
                    cid++;
                    ved.push(false);
                }
            }
            for (let i = 0; i < nn-1; i++)
                if (getPa(i) != getPa(i+1))
                {
                    let r1 = i;
                    let r2 = i+1;
                    let ew = Math.floor(1+Math.random()*9);
                    if (r1 != r2) {
                        addEdge(r1, r2, ew, cid);
                        cid++;
                        ved.push(false);
                    }
                }
            edges.sort(compareEdge);
            for (let i = 0; i < edges.length; i++)
            {
                console.log(edges[i].to + " " + edges[i].from + " " + edges[i].weight);
            }
            let pot = [];
            let curp = [];
            pah.length = nn-1;
            p.length = 0;
            for (let i = 0; i < nn; i++)
                p.push(i);
            for (let i = 0; i < nn; i++)
                curp.push(getPa(i));
            pah[0] = [...curp];
            potH.length = nn;
            vish[0] = [...vis];
            potH[0] = [...pot];
            for (let i = 0; i < nn-1; i++)
            {
                for (let j = 0; j < edges.length; j++)
                {
                    if (!vis[j] && getPa(edges[j].from) != getPa(edges[j].to)) {
                        console.log("weight incoming" + edges[j].weight);
                        console.log("to from " + edges[j].to + " " + edges[j].from);
                        p[getPa(edges[j].from)] = getPa(edges[j].to);
                        vis[j] = true;
                        break;
                    }
                }
                vish[i+1] = [...vis];
                for (let j = 0; j < nn; j++)
                    curp[j] = getPa(j);
                pah[i+1] = [...curp];
            }
            //for (let i = 0; i < nn; i++)
            //    console.log(vish[i])
            display(netNodes, netEdges);
            setReset(0);
            refreshData();           
        }
        else
        {
            for (let i = 0; i < nn; i++)
            {
                netNodes.get(i).color = {
                    background:colors[pah[step][i]],
                }
            }
            for (let i = 0; i < vish[step].length; i++)
            {
                console.log(i + " " + edges[i].id);
                if (vish[step][i]) {
                    netEdges.get(edges[i].id).color = {
                        color:visColor,
                    }
                }
                else {
                    netEdges.get(edges[i].id).color = {
                        inheritColor: false,
                        color:darkEdgeColor,
                    }
                }
            }
            let ni = netNodes.getIds();
            for (let i = 0; i < ni.length; i++)
            {
                netNodes.update(netNodes.get(ni[i]));
            }
            let ei = netEdges.getIds();
            for (let i = 0; i < ei.length; i++)
            {
                netEdges.update(netEdges.get(ei[i]));
            }
            refreshData();
            //display(netNodes, netEdges);
        }
    });
    const tr = (
        <div>
            <h3>NODES: {nn}<br></br><br></br>STEP: {step}</h3>
            <button type="button" onClick={() => {
                if (step > 0)
                    setStep(step-1);
            }}>Prev</button>
            <button type="button" onClick={() => {
                if (step < nn-1)
                    setStep(step+1);
            }}>Next</button>
            <h3>INPUT NUMBER OF NODES(2-20)</h3>
            <input type="text" id="number" name="number" />
            <br></br>
            <button type="button" onClick={() => {
                const elem = document.getElementById('number')
                if(typeof elem !== 'undefined' && elem !== null && elem.value > 1 && elem.value <= 20) {
                    setStep(0);
                    setNumNodes(elem.value);
                    setReset(1);
                }
            }}>Submit</button>
        </div>
    );
    return tr;
}



function App() {
    return (
        <div>
            <head>
                <script async src="https://www.googletagmanager.com/gtag/js?id=G-W2K3RBN9YT"></script>
                <script>
                    window.dataLayer = window.dataLayer || [];
                    function gtag(){window.dataLayer.push(arguments)}
                    gtag('js', new Date());

                    gtag('config', 'G-W2K3RBN9YT');
                </script>
            </head>
            <NavBar/>
            <div id="cont">
                <div id='c1'>
                    <div id="mynetwork"></div>
                    <h3>Drag screen to move view, Drag nodes to change orientation, Scroll to zoom</h3>
                </div>
                <div id='c2'>
                    <Graph/>
                    <h3>Edges in Priority Queue (min weight first)</h3>
                    <table id="edgetable" border="1"></table>
                </div>
            </div>
        </div>
    );
}

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(<App />);