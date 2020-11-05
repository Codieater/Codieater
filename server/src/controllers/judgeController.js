const { spawn } = require('child_process');
const fs = require('fs');
const models = require('../models');
const PWD = '/Users/redundant4u/Documents/project/Codieater';

exports.judge = function(req, res) {
    const USERID = req.body.userid;
    const PROBNO = 1; // read from db
    const CODE = decodeEntities(req.body.code);
    const LANG = req.body.lang;
    const LANGKIND = LANG.substring(1, LANG.length);
    const TIME = 1; // read from db

    models.history.create({
        probNo: PROBNO,
        userId: USERID,
        lang: LANG,
        time: TIME
    })
    .then(q => {
        console.log('history insert complete');

        const MARKNO = q['markNo'];
        let EXTENSION;

        switch(LANG[0]) {
            case '0': EXTENSION = 'cpp'; break;
            case '1': EXTENSION = 'py'; break;
            case '2': EXTENSION = 'py'; break;
        }

        fs.mkdirSync(`${PWD}/volume/mark_no/${MARKNO}`);
        fs.writeFileSync(`${PWD}/volume/mark_no/${MARKNO}/Main.` + EXTENSION, CODE, function (e) {
            if(e) {
                console.log('file write fail');
                console.log(e);
            }
        });

        const ARG = { USERID, MARKNO, PROBNO, LANGKIND, CODE, res };

        system(ARG);
    })
    .catch(e => {
        console.log('history insert fail');
        console.log(e);

        res.status(500).json({ error: 'something go wrong' });
    });
}

// MARKNO => CODE DIR
// PROBNO => IN/OUT DIR
const system = function (ARG) {
    const docker = spawn('docker', [
        'run',
        '--rm',
        '-e', 'MARKPATH=/home/data/mark_no/',
        '-e', 'PROBPATH=/home/data/prob_no/',
        '-v', `${PWD}/judge:/home/judge`,
        '-v', `${PWD}/volume/mark_no/${ARG['MARKNO']}:/home/mark`,
        '-v', `${PWD}/volume/mark_no/${ARG['PROBNO']}:/home/prob`,
        'judge:1.0', 'sh', '-c', `./judge -l ${ARG['LANGKIND']}`
    ]);

    docker.stdout.on('data', (data) => {
        console.log(data.toString());
    });
    
    docker.stderr.on('data', (data) => { console.error(`stderr: ${data}`); });
    
    docker.on('close', (code) => {
        const file = fs.readFileSync(`${PWD}volume/mark_no/${MARKNO}/result.json`);
        let JUDGERES = JSON.parse(file);

        let query = { 'result': 0, 'score': 0 };
        let score = 0;

        // compile complete
        if( JUDGERES.compile == 1 ) {
            const length = Object.keys(JUDGERES.result).length

            // 채점 결과의 msg들을 순서대로 보여주고 점수 계산
            JUDGERES['result'].forEach(elem => score += elem['check']);
            score = Math.floor( score / length * 100 );
    
            query = { 'result': 1, 'score': score };
        }

        models.history.update(query, { where: {userId: ARG['USERID']} })
        .then(res => {
            console.log('history result is updated');
            console.log(res);
        })
        .catch(e => {
            console.log('history result update fail');
            console.log(e);
        })

        console.log(`child process exited with code ${code}`);

        ARG['res'].render('../views/judge/index.ejs', {
            USERID: ARG['USERID'],
            PROBNO: ARG['PROBNO'],
            CODE: ARG['CODE'],
            LANG: ARG['LANGKIND'],
            SCORE: score,
            JUDGERES: JUDGERES
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