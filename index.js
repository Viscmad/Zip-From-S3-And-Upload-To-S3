const AWS = require("aws-sdk");
const s3Zip = require("s3-zip");


exports.handler = async (event, context) => {
  console.log("event", event);

  const region = event.region;
  const bucket = event.bucket;
  const folder = event.folder;
  const zipFileName = event.zipFileName;

  // Create body stream
  try {
    const s3 = new AWS.S3({ region: region, });
    const params = {
      Bucket: bucket,
      Prefix: folder,
    };
    const filesArray = []

    s3.listObjects(params, function (err, data) {
      if (err) throw err;
      console.log("listObjects files : ", data);
      for (let i = 0; i < data.Contents.length; i++) {
        const filePath = data.Contents[i].Key
        const filePathArray = filePath.split('/')
        const fileName = filePathArray[filePathArray.length - 1]
        filesArray.push(filePath.replace(folder, ''))
      }
      console.log("listObjects filesArray : ", filesArray);
      const body = s3Zip.archive(
        { region: region, bucket: bucket, debug: true, preserveFolderStructure: true },
        folder,
        filesArray
      );
      console.log("s3Zip.archive body : ", body);
      const zipParams = { params: { Bucket: bucket, Key: zipFileName } };
      const zipFile = new AWS.S3(zipParams);
      zipFile
        .upload({ Body: body })
        .on("httpUploadProgress", function (evt) {
          console.log(evt);
        })
        .send(function (e, r) {
          if (e) {
            const err = "zipFile.upload error " + e;
            console.log(err);
            context.fail(err);
          }
          console.log(r);
          context.succeed(r);
          return;
        });
    });


  } catch (e) {
    const err = "catched error: " + e;
    console.log(err);
    context.fail(err);
  }
};
