require('dotenv').config();

const db = require('../models');
const fs = require('fs');
const PWD = process.env.WORKDIR;

exports.index = function (req, res) {
    res.render('../views/problem/index.ejs');
}

exports.registerGet = function (req, res) {
    db.tag.findAll({
        attributes: ['tagName'],
        raw: true
    })
    .then(q => {
        console.log(q);
        res.render( '../views/problem/register.ejs', {TAGS: q} );
    })
    .catch(e => {
        console.log('fail to load tags');
        // console.log(e);

        res.redirect('/');
    });
}

exports.registerPost = async function (req, res) {
    const TITLE         =   req.body['title'];
    const DESCRIPTION   =   req.body['description'];
    const MEM           =   req.body['memory'];
    const TIME          =   req.body['time'];
    const INPUT         =   req.body['input'];
    const OUTPUT        =   req.body['output'];
    const INPUTFILE     =   req.files['inputfile'];
    const OUTPUTFILE    =   req.files['outputfile'];
    const SAMPLEINPUT   =   req.body['sampleinput'];
    const SAMPLEOUTPUT  =   req.body['sampleoutput'];
    let TAGS;

    // tag가 하나 일 때는 array가 아닌 string으로 인식해서 변환
    if( typeof(req.body['tag']) == 'string' )
        TAGS = req.body['tag'].split();
    else 
        TAGS = req.body['tag'];

    let tagsId = [];

    // if tag is new, create
    for( let i = 0; i < TAGS.length; i++ ) {
        await db.tag.findAll({
            raw: true,
            attributes: [ 'tagId', 'tagName' ],
            where: { tagName: TAGS[i] }
        })
        .then(q => {
            // if tag is new
            if(!q[0]) {
                db.tag.create({
                    tagName: TAGS[i]
                })
                .then(q => {
                    tagsId.push(q['tagId']);
                    console.log('tag insertion success');
                })
                .catch(e => {
                    console.log('tag insertion failed');
                })
            }

            else tagsId.push(q[0]['tagId']);
        })
        .catch(e => {
            // console.log(e);
        })
    }

    // create problem
    db.problem.create({
        userId: 1,
        title: TITLE,
        description: DESCRIPTION,
        memoryLim: MEM,
        timeLim: TIME,
        input: INPUT,
        output: OUTPUT,
        sampleInput: SAMPLEINPUT,
        sampleOutput: SAMPLEOUTPUT,
    })
    .then(q => {
        // insert input, output data
        const PATH = `${PWD}/volume/prob_no/` + q['probNo'];
        const INPATH = `${PWD}/volume/prob_no/` + q['probNo'] + '/in';
        const OUTPATH = `${PWD}/volume/prob_no/` + q['probNo'] + '/out';

        fs.mkdirSync(PATH);
        fs.mkdirSync(INPATH);
        fs.mkdirSync(OUTPATH);

        for( let i = 1; i < INPUTFILE.length + 1; i++ ) {
            fs.writeFileSync( INPATH + '/' + i + '.in', INPUTFILE[i-1].buffer, function(e) {
                if(e) {
                    console.log('input file insertion failed');
                    console.log(e);
                }
            });

            fs.writeFileSync( OUTPATH + '/' + i + '.out', OUTPUTFILE[i-1].buffer, function(e) {
                if(e) {
                    console.log('output file insertion failed');
                    console.log(e);
                }
            });
        }

        // tag connect
        tagsId.forEach(elem => {
            db.problem_tag.create({
                probNo: q['probNo'],
                tagId: elem
            })
            .then(q => {
                console.log('tag connect');
                // console.log(q);
            })
            .catch(e => {
                console.log('tag connect failed');
                // console.log(e);
            })
        })

        console.log('problem insertion success');
        // console.log(q);
    })
    .catch(e => {
        console.log('problem insertion failed');
        console.log(e);

    });

    res.redirect('/');
}