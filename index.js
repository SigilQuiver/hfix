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
  
  console.log(`Looking at URL: ${url}`)

  // go to url in browser
  await page.goto(url,{ waitUntil: 'networkidle0' });

  // wait until at desired url
  await page.waitForFunction(`window.location.href == "${url}"`);

  const data = await page.evaluate(() => document.querySelector('*').outerHTML);
  console.log(data);

  console.log("Finished looking at page, evaluating scripts...")


  
  // look at all scripts in the webpage
  let scripts = await page.$$eval('script[type="application/ld+json"]', (s) => {return s.map((t) => {return JSON.parse(t.innerHTML)})});

  console.log("Looking through found scripts...")

  let final_script;
  let current_script;

  // loop through scripts
  while (scripts.length > 0){
    current_script = scripts[0];

    // check is script is a video object
    if (current_script["@type"] == "VideoObject"){
      
      //return valid script
      console.log(`Valid script: ${current_script}`)

      final_script = current_script;
      break;
    }

  }

  // returns nothing if not found
  return final_script;
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

  // get video data
  const video_data = await get_video_puppet(url);

  // check if video_data was gotten
  if (!(video_data)){
    console.log("Invalid video data")
    res.status(400).send();
  }else{
    console.log("Valid video data, getting html file...")

    // get html file to string
    var html;
    html = fs.readFileSync('/opt/render/project/src/og.html', 'utf8', (err, data) => {
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

    console.log("Finished! /nSending HTML...")

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

