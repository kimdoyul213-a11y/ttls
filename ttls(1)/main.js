const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const ROWS = 20;
const COLS = 10;
const SIZE = 30;

let board, current, next, score, startTime, gameOver;
let lastTime = 0;
let rankings = JSON.parse(localStorage.getItem('tetrisRankings')) || [];

const SHAPES = [
    [[1,1,1,1]],
    [[1,1],[1,1]],
    [[0,1,0],[1,1,1]],
    [[1,1,0],[0,1,1]],
    [[0,1,1],[1,1,0]],
    [[1,0,0],[1,1,1]],
    [[0,0,1],[1,1,1]]
];

const COLORS = [
    "cyan","yellow","purple","red","green","blue","orange"
];

function createPiece(){
    const i = Math.floor(Math.random()*SHAPES.length);
    return {
        shape: SHAPES[i],
        color: COLORS[i],
        x: Math.floor(COLS/2)-1,
        y: 0
    };
}

function showNicknameModal(){
    const playTime = Math.floor((Date.now()-startTime)/1000);
    document.getElementById('modalScore').textContent = score;
    document.getElementById('modalTime').textContent = playTime;
    document.getElementById('nicknameModal').style.display = 'flex';
    document.getElementById('nicknameInput').value = '';
    document.getElementById('nicknameInput').focus();
}

function saveRanking(){
    const nickname = document.getElementById('nicknameInput').value.trim() || '익명';
    const playTime = Math.floor((Date.now()-startTime)/1000);
    
    rankings.push({
        nickname: nickname,
        score: score, 
        time: playTime, 
        date: new Date().toLocaleDateString()
    });
    
    rankings.sort((a,b) => b.score - a.score);
    rankings = rankings.slice(0, 10);
    localStorage.setItem('tetrisRankings', JSON.stringify(rankings));
    
    document.getElementById('nicknameModal').style.display = 'none';
    document.getElementById("restartBtn").style.display = "block";
    displayRankings();
}

function displayRankings(){
    const list = document.getElementById('rankingList');
    if(rankings.length === 0){
        list.innerHTML = '<li>기록 없음</li>';
        return;
    }
    list.innerHTML = rankings.map((r, i) => 
        `<li>${i+1}위 - ${r.nickname} : ${r.score}점 (${r.time}초)</li>`
    ).join('');
}

function resetGame(){
    board = Array.from({length: ROWS}, ()=>Array(COLS).fill(0));
    next = [createPiece(), createPiece(), createPiece()];
    current = next.shift();
    next.push(createPiece());
    score = 0;
    startTime = Date.now();
    gameOver = false;
    document.getElementById("restartBtn").style.display = "none";
}

function collide(px, py, shape){
    for(let y=0;y<shape.length;y++){
        for(let x=0;x<shape[y].length;x++){
            if(shape[y][x]){
                if(board[py+y]?.[px+x] !== 0) return true;
            }
        }
    }
    return false;
}

function merge(){
    current.shape.forEach((row,y)=>{
        row.forEach((v,x)=>{
            if(v) board[current.y+y][current.x+x] = current.color;
        });
    });
}

function clearLines(){
    for(let y=ROWS-1;y>=0;y--){
        if(board[y].every(v=>v!==0)){
            board.splice(y,1);
            board.unshift(Array(COLS).fill(0));
            score += 10;
            y++;
        }
    }
}

function drawBlock(x,y,color,context=ctx,size=SIZE){
    context.fillStyle = color;
    context.fillRect(x*size,y*size,size-1,size-1);
}

function draw(){
    ctx.clearRect(0,0,canvas.width,canvas.height);

    board.forEach((row,y)=>row.forEach((v,x)=>{
        if(v) drawBlock(x,y,v);
    }));

    current.shape.forEach((row,y)=>row.forEach((v,x)=>{
        if(v) drawBlock(current.x+x,current.y+y,current.color);
    }));
}

function drawNext(){
    for(let i=0;i<3;i++){
        const c = document.getElementById("next"+(i+1));
        const cx = c.getContext("2d");
        cx.clearRect(0,0,c.width,c.height);

        const p = next[i];
        const s = 20;
        const ox = (c.width - p.shape[0].length*s)/2;
        const oy = (c.height - p.shape.length*s)/2;

        p.shape.forEach((row,y)=>row.forEach((v,x)=>{
            if(v){
                cx.fillStyle = p.color;
                cx.fillRect(ox+x*s,oy+y*s,s-1,s-1);
            }
        }));
    }
}

function drop(){
    if(!collide(current.x,current.y+1,current.shape)){
        current.y++;
    }else{
        merge();
        clearLines();
        current = next.shift();
        next.push(createPiece());
        if(collide(current.x,current.y,current.shape)){
            gameOver = true;
            showNicknameModal();
        }
    }
}

document.addEventListener("keydown",e=>{
    if(gameOver) return;
    if(e.key==="ArrowLeft" && !collide(current.x-1,current.y,current.shape)) current.x--;
    if(e.key==="ArrowRight" && !collide(current.x+1,current.y,current.shape)) current.x++;
    if(e.key==="ArrowDown") drop();
    if(e.key==="ArrowUp"){
        const r = current.shape[0].map((_,i)=>current.shape.map(row=>row[i]).reverse());
        if(!collide(current.x,current.y,r)) current.shape = r;
    }
    if(e.key===" ") while(!collide(current.x,current.y+1,current.shape)) current.y++;
});

document.getElementById("restartBtn").onclick = resetGame;
document.getElementById("saveRankingBtn").onclick = saveRanking;

// 엔터키로 저장 가능하게
document.getElementById("nicknameInput").addEventListener("keypress", (e) => {
    if(e.key === "Enter") saveRanking();
});

function loop(t=0){
    if(!gameOver && t-lastTime>500){
        drop();
        lastTime=t;
    }

    draw();
    drawNext();

    document.getElementById("score").innerText = "Score: "+score;
    document.getElementById("time").innerText =
        "Time: "+Math.floor((Date.now()-startTime)/1000)+"s";

    requestAnimationFrame(loop);
}

displayRankings();
resetGame();
loop();
