require('dotenv').config();

const { spawn } = require('child_process');
const fs = require('fs');
const db = require('../models');
const PWD = process.env.WORKDIR;

exports.judgePost = async function(req, res) {
    const USERID = req.user.idx;
    const PROBNO = req.body.userid; // read from db
    const CODE = decodeEntities(req.body.code);
    const LANG = req.body.lang;
    const LANGKIND = LANG.substring(1, LANG.length);
    let MEM;
    let TIME;

    await db.problem.findOne({
        raw: true,
        where: { probNo: PROBNO }
    })
    .then(q => {
        MEM = q['memoryLim'];
        TIME = q['timeLim'];
    })
    .catch(e => {
        console.log(e);
    })

    db.history.create({
        probNo: PROBNO,
        userId: USERID,
        lang: LANG,
        memory: MEM,
        time: TIME
    })
    .then(q => {
        console.log('history insertion success');

        const MARKNO = q['markNo'];
        let EXTENSION;

        switch(LANG[0]) {
            case '0': EXTENSION = 'cpp'; break;
            case '1': EXTENSION = 'cpp'; break;
            case '2': EXTENSION = 'cpp'; break;
            case '3': EXTENSION = 'py'; break;
            case '4': EXTENSION = 'py'; break;
            case '5': EXTENSION = 'c'; break;
            case '6': EXTENSION = 'c'; break;
            case '7': EXTENSION = 'java'; break;
        }

        fs.mkdirSync(`${PWD}/volume/mark_no/${MARKNO}`);
        fs.writeFileSync(`${PWD}/volume/mark_no/${MARKNO}/Main.` + EXTENSION, CODE, function (e) {
            if(e) {
                console.log('file writing failed');
                // console.log(e);
            }
        });

        const ARG = { USERID, MARKNO, PROBNO, LANGKIND, CODE, MEM, TIME, res };

        system(ARG);
    })
    .catch(e => {
        console.log('history insertion failed');
        // console.log(e);

        res.status(500).json({ error: 'something go wrong' });
    });
}

// MARKNO => CODE DIR
// PROBNO => IN/OUT DIR
const system = function (ARG) {
    const docker = spawn('docker', [
        'run',
        '--rm',
        '-e', 'MARKPATH=/home/mark/',
        '-e', 'PROBPATH=/home//prob/',
        '-v', `${PWD}/volume/mark_no/${ARG['MARKNO']}:/home/mark`,
        '-v', `${PWD}/volume/prob_no/${ARG['PROBNO']}:/home/prob`,
        'codi_judge:2.0', 'sh', '-c', `./judge -l ${ARG['LANGKIND']} -m ${ARG['MEM']} -s 1 -t ${ARG['TIME']}`
    ]);

    docker.stdout.on('data', (data) => {
        console.log(data.toString());
    });
    
    docker.stderr.on('data', (data) => { console.error(`stderr: ${data}`); });
    
    docker.on('close', (code) => {
        const file = fs.readFileSync(`${PWD}/volume/mark_no/${ARG['MARKNO']}/result.json`);

        let JUDGERES = JSON.parse(file);
        let memory = new Array();
        let time = new Array();

        const COMPILEMSG = JUDGERES['compile_msg']

        let query = { 'result': 0, 'score': 0 };
        let score = 0;

        // compile complete
        if( JUDGERES.compile == 1 ) {
            const length = Object.keys(JUDGERES.result).length

            // 채점 결과의 msg들을 순서대로 보여주고 점수 계산
            JUDGERES['result'].forEach(elem => {
                memory.push(elem['memory']);
                time.push(elem['time']);
                score += elem['check'];
            });
            score = Math.floor( score / length * 100 );
        }

        if( score == 100 ) query = { 'result': 1 };
        else query = { 'result': 0 };

        db.history.update(query, { where: {markNo: ARG['MARKNO']} })
        .then(res => {
            console.log('history result is updated');
            // console.log(res);
        })
        .catch(e => {
            console.log('history result updating is failed');
            // console.log(e);
        })

        console.log(`child process exited with code ${code}`);

        console.log(memory);
        console.log(time);

        ARG['res'].render('../views/judge/judge.ejs', {
            USERID: ARG['USERID'],
            PROBNO: ARG['PROBNO'],
            CODE: ARG['CODE'],
            LANG: ARG['LANGKIND'],
            COMPILEMSG: COMPILEMSG,
            SCORE: score,
            JUDGERES: JUDGERES,
            MEMORY: memory,
            TIME: time
        });
    });
}

// for test
const decodeEntities = function (encodedString) {
    var translate_re = /&(nbsp|amp|quot|lt|gt);/g;
    var translate = {
        "nbsp":" ",
        "amp" : "&",
        "quot": "\"",
        "lt"  : "<",
        "gt"  : ">"
    };
    return encodedString.replace(translate_re, function(match, entity) {
        return translate[entity];
    }).replace(/&#(\d+);/gi, function(match, numStr) {
        var num = parseInt(numStr, 10);
        return String.fromCharCode(num);
    });
}
