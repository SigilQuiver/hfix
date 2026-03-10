const cheerio = require("cheerio");
const fs = require('node:fs');

// express import
const express = require('express');
const app = express();
app.use(express.json());

// port stuff
const port = 8080;
const host = "0.0.0.0";


const puppeteer = require("puppeteer")

var browser;
var page;

// scrape video data from pmvhaven with puppeteer
async function get_video_puppet(url){

  console.log(`Looking at URL:${url}`)
  // go to url in browser
  await page.goto(url);

  console.log("Finished looking at page, evaluating scripts...")
  
  // look at all scripts in the webpage
  const scripts = await page.$$eval('script[type="application/ld+json"]', (s) => {return s.map((t) => {return JSON.parse(t.innerHTML)})});

  console.log("Looking through found scripts...")

  //check all scripts that have json type in html head
  for (const el of scripts){
    console.log(`* Script:${el}`)
    try{
      // see fs json type is video
      if (el["@type"] == "VideoObject"){
        //return valid data
        console.log(`Valid script:${el}`);
        return el;
      }
    } catch (e){
      console.log("ERROR:")
      console.error(e);
    }
  }

  return null;
}

app.get("/favicon.ico",(req,res) =>{
  res.end();
});

app.get("/",(req,res) =>{
  res.end();
});

//read end of url
app.get("/{*splat}",async (req,res) =>{

  //add url to original url
  const url = "https://pmvhaven.com"+req.originalUrl;
  console.log("looking at:",url);

  // get video data
  const video_data = await get_video_puppet(url);

  if (!(video_data)){
    res.status(400).send();
  }else{
    // get html file to string
    var html;
    html = fs.readFileSync('./og.html', 'utf8', (err, data) => {
      if (err) {
        console.error(err);
        return;
      }
      html = data;


      return  html
    });


    console.log(Object.keys(video_data))

    //add in ogl data
    html = html.replaceAll("!url",video_data.embedUrl);
    html = html.replaceAll("!title",video_data.name);
    html = html.replaceAll("!description",video_data.description);

    let video_url = video_data.contentUrl;
    video_url = video_url.substring(0,video_url.lastIndexOf("/"));
    html = html.replaceAll("!video",video_url);
    console.log("content_url:"+video_url);

    //send response
    res.set('Content-Type', 'text/html');
    res.status(200).send(Buffer.from(html));
  }
});

//listen to url, show url
app.listen(port,host, async () => {
  //load puppeteer browser
  console.log("Loading puppeteer browser...")
  browser = await puppeteer.launch();

  console.log("Making a page in the browser...")
  page = await browser.newPage();
  console.log(`Server running at http://${host}:${port}/`);
  

  //test url
  //console.log(get_video_puppet("https://pmvhaven.com/video/scrolling-madness_66c75486187495e5deea1084?from=recommended"))
}); 

