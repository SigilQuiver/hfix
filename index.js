const cheerio = require("cheerio");
const fs = require('node:fs');
const express = require('express');
const app = express();
app.use(express.json());

const port = 8080
const host = "0.0.0.0"

// scrape video data from pmvhaven
async function get_video(url) {

  // get html
  const res2 = await fetch(url);
  const html = await res2.text();

  // parse
  const $ = cheerio.load(html);
  
  var d = null;
  //check all scripts that have json type in html head
  for (const el of $('script[type="application/ld+json"]',"head")){
    try{
      // get script content
      d = el.children[0].data;
      // parse content into json
      d = JSON.parse(d);
      // see is json type is video
      if (d["@type"] == "VideoObject"){
        //return valid data
        return d;
      }
    } catch (e){
      console.log(e);
    }
  }
  return d;
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
  const video_data = await get_video(url);
  console.log(video_data["@type"])
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
app.listen(port,host, () => {
  console.log(`Server running at http://${host}:${port}/`);
}); 

