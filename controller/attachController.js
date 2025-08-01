const express = require("express");
const router = express.Router();
const path = require("path");
const fs = require("fs");
const randomstring = require("randomstring");
const base64Img = require("base64-img");

const Sequelize = require("sequelize");
const Op = Sequelize.Op;

const resjson = require("../core/resjson");

// load model
const { Attach } = require("../models");
const envFile = require("../config/environment");

let allowedExt = [
  ".jpeg",
  ".png",
  ".jpg",
  ".mp4",
  ".3gp",
  ".pdf",
  ".csv",
  ".xlsx",
];
const isAllowedExt = (ext) => allowedExt.indexOf(ext) > -1;

let tempFileStore = (req, res) => {
  if (req.file == null) {
    res.status(200).json(resjson("", "please upload the file", "", 1));
  }
  const tempPath = req.file.path;

  let tempName = req.file.originalname;

  const targetPath = path.join(__dirname, "../temp/" + tempName);
  console.log("images path", tempPath, targetPath);

  if (true) {
    fs.rename(tempPath, targetPath, (err) => {
      res.status(200).json(
        resjson(
          {
            fileName: tempName,
          },
          null,
          null
        )
      );
    });
  } else {
    fs.unlink(tempPath, (err) => {
      if (err) return res.status(422).json(null, null, err);
      res
        .status(422)
        .json(resjson("", `FileType(${orgFileExt}) is not allowed!`, "", 1));
    });
  }
};

let storingFiles = async (className, id, fileName, isSingle, isPrimary) => {
  //   console.log({ className, fileName, id, isSingle, isPrimary });
  let oldPath = `temp/${fileName}`;

  console.log(oldPath);
  let newPath = `dine_oh/media/${className}/${id}/`;
  console.log(newPath);
  return new Promise(async (resolve) => {
    let isAlreadyHaveAttach = await getAttachmentDetails(id, className);
    if (isAlreadyHaveAttach && isSingle) {
      await deleteAllFiles(newPath);
    }
    if (!(await isfileExist(oldPath))) {
      console.log("isfileExist");
      return resolve(false);
    }
    if (uploadFileToS3(newPath, fileName)) {
      console.log("uploadFileToS3", newPath, fileName);

      let stats = fs.statSync(oldPath);

      // is primary checking
      if (isPrimary) {
        await Attach.update(
          {
            is_primary: false,
          },
          {
            where: {
              [Op.and]: [{ foreign_id: id }, { class: className }],
            },
          }
        )
          .then()
          .catch((err) => console.log(err));
      } else {
        await Attach.findAll({
          where: {
            [Op.and]: [{ foreign_id: id }, { class: className }],
          },
        })
          .then((arrayResult) => {
            console.log(arrayResult);

            if (arrayResult.length > 0) {
              let isPrimaryFlag = 0;
              for (let i = 0; i < arrayResult.length; i++) {
                console.log("primary", arrayResult[i].is_primary);
                if (arrayResult[i].is_primary === true) {
                  ++isPrimaryFlag;
                }
              }
              if (isPrimaryFlag !== 1) {
                for (let j = 0; j < arrayResult.length; j++) {
                  if (j === 0) {
                    Attach.update(
                      {
                        is_primary: true,
                      },
                      {
                        where: {
                          id: arrayResult[j].id,
                        },
                      }
                    )
                      .then()
                      .catch((err) => {
                        console.log(err);
                      });
                  } else {
                    Attach.update(
                      {
                        is_primary: false,
                      },
                      {
                        where: {
                          id: arrayResult[j].id,
                        },
                      }
                    )
                      .then()
                      .catch((err) => {
                        console.log(err);
                      });
                  }
                }
              }
            }
          })
          .catch((err) => console.log(err));
      }

      if (!isSingle) {
        Attach.create({
          class: className,
          foreign_id: id,
          dir: newPath,
          file_name: fileName,
          file_size: stats.size,
          is_primary: isPrimary,
        })
          .then((result) => {
            // deleteFiles(oldPath);
            resolve(true);
          })
          .catch((err) => {
            console.log("in create attach", err);
          });
      } else if (!isAlreadyHaveAttach && isSingle) {
        Attach.create({
          class: className,
          foreign_id: id,
          dir: newPath,
          file_name: fileName,
          file_size: stats.size,
          is_primary: isPrimary,
        })
          .then((result) => {
            resolve(true);
            deleteFiles(oldPath);
          })
          .catch((err) => {
            console.log("in create attach", err);
          });
      } else {
        Attach.update(
          {
            dir: newPath,
            file_name: fileName,
            file_size: stats.size,
            is_primary: isPrimary,
          },
          {
            where: {
              [Op.and]: [{ foreign_id: id }, { class: className }],
            },
          }
        )
          .then((result) => {
            deleteFiles(oldPath);
            resolve(true);
          })
          .catch((err) => console.log(err));
      }
    } else {
      res(false);
    }
  });
};

let multiFileStore = async (imageClass, imageArray, id, isSingle) => {
  console.log({ imageClass, imageArray, id, isSingle });
  return new Promise(async (resolve) => {
    // get image this.name
    let getImageFileName = async (i) => {
      if (
        imageArray[i].image_data !== null &&
        imageArray[i].image_data !== undefined
      ) {
        let base64FileName = await b64ToImage(imageArray[i].image_data);

        console.log({ base64FileName });

        return base64FileName;
      } else {
        return imageArray[i].image;
      }
    };
    let loopLength = isSingle ? 1 : imageArray.length;
    for (let i = 0; i < loopLength; i++) {
      let imageName = await getImageFileName(i);
      console.log(imageName);
      // console.log("in multi for", isSingle);
      let status = await storingFiles(
        imageClass,
        id,
        imageName,
        isSingle,
        imageArray[i].is_primary
      );

      //   console.log(status);

      if (!status) {
        resolve(false);
      }
      if (i == loopLength - 1) {
        resolve(true);
      }
    }
  });
};

// converting base64 to image
let b64ToImage = async (imageData) => {
  return new Promise((resolve) => {
    let tempName = randomstring.generate(10);
    if (imageData != null) {
      let destFolder = "temp";
      base64Img.img(imageData, destFolder, tempName, (err, filepath) => {
        if (err) {
          console.log(err);
          resolve(false);
        } else {
          let fileName = filepath.slice(5);
          resolve(fileName);
        }
      });
    }
  });
};

let getAttachmentDetails = async (id, className) => {
  return await Attach.findOne({
    where: {
      [Op.and]: [{ foreign_id: id }, { class: className }],
    },
  }).then((result) => {
    if (result != null) {
      return result;
    } else {
      return false;
    }
  });
};

// found file exists or not
let isfileExist = async (filePath) => {
  console.log("isfileExist", filePath);
  try {
    if (fs.existsSync(filePath)) {
      console.log("in file exist");
      return true;
    } else {
      console.log("isfileExist Inside else");
      return false;
    }
  } catch (err) {
    console.error("in isfileExist", err);
    return false;
  }
};

let deleteFiles = (filePath, dirName) => {
  return new Promise(async (resolve) => {
    if (await isfileExist(filePath)) {
      fs.unlink(filePath, (err) => {
        if (err) {
          console.log(err);
          resolve(false);
        } else {
          if (dirName) {
            deleteDir(dirName);
          }
          console.log("in delete files");
          resolve(true);
        }
      });
    } else {
      resolve(false);
    }
  });
};
//get attachmeny details by id
let getAttachmentDetailsById = async (id) => {
  return await Attach.findOne({
    where: { id },
  }).then((result) => {
    if (result != null) {
      return result;
    } else {
      return false;
    }
  });
};

let deleteFileUpdateInDb = (id) => {
  return new Promise(async (resolve) => {
    let attachment = await getAttachmentDetailsById(id);

    console.log({ attachment });

    if (
      await deleteFileInS3(
        `${attachment.dir}${attachment.file_name}`,
        attachment.dir
      )
    ) {
      Attach.destroy({
        where: { id },
      })
        .then((result) => {
          resolve(true);
        })
        .catch((err) => {
          console.log("in deleteFileUpdateInDb", err);
          resolve(false);
        });
    } else {
      resolve(false);
    }
  });
};

let deleteAttachments = async (req, res) => {
  let id = req.params.id;
  let attachment = await getAttachmentDetailsById(id);
  if (attachment) {
    if (await deleteFileUpdateInDb(id)) {
      res.json(resjson("", "Attachment was deleted successfully"));
    } else {
      res.status(422).json(resjson("", "Something Went wrong", "", 1));
    }
  } else {
    res.status(404).json(resjson("", "attachement not found", "", "1"));
  }
};

// get all Deals
let getAllAttachments = async (req, res) => {
  let filter = req.query.filter;

  filter === undefined
    ? (filter = "")
    : (filter = JSON.parse(req.query.filter));

  let limit = req.query.limit ? parseInt(req.query.limit) : req.query.limit;
  let offset = req.query.offset ? parseInt(req.query.offset) : req.query.offset;

  Attach.findAndCountAll({
    where: filter.where,
    limit,
    offset,
    order: [["id", "DESC"]],
  })
    .then((attach) => {
      return res.json(resjson(attach, "", ""));
    })
    .catch((err) => {
      console.log(err);
      return res.status(422).json(resjson("", "Something Went wrong", "", 1));
    });
};

/////////////////////////////////////
const AWS = require("aws-sdk");

AWS.config.update(envFile.aws);

var s3 = new AWS.S3();

let uploadFileToS3 = async (key, fileName) => {
  return new Promise((res, rej) => {
    try {
      console.log("in upload");
      // const filePath = path.join('C:', 'Users', 'Welcome', 'Documents', 'GitHub', 'temp', fileName);
      fs.readFile(`temp/${fileName}`, function (err, data) {
        if (err) {
          console.log("err in read file", err);
          res(false);
        }

        let params = {
          Bucket: envFile.s3.bucket,
          Key: `${key}${fileName}`,
          Body: data,
        };

        s3.upload(params, function (err, data) {
          if (err) {
            console.log("err in file upload", err);
            res(false);
          } else {
            res(true);
          }
        });
      });
    } catch (err) {
      console.log(err);
      res(false);
    }
  });
};

let deleteFileInS3 = (key, fileName) => {
  return new Promise((res, rej) => {
    var params = {
      Bucket: envFile.s3.bucket,
      Key: key,
    };

    s3.deleteObject(params, function (err, data) {
      if (err) {
        console.log(err, err.stack);
        res(false);
      }
      // an error occurred
      else res(true); // successful response
    });
  });
};

let deleteAllFiles = async (key) => {
  return new Promise((res) => {
    let params = {
      Bucket: envFile.s3.bucket,
      Prefix: key,
    };
    s3.listObjects(params, function (err, data) {
      if (err) {
        // console.log(err, err.stack);
        res(false);
      }
      // an error occurred
      if (data.Contents.length == 0) res(false);
      let keyObjectArr = [];
      data.Contents.forEach((content) => {
        // console.log({ content });
        keyObjectArr.push({ Key: content.Key });
      });

      let params1 = {
        Bucket: envFile.s3.bucket,
        Delete: {
          Objects: keyObjectArr,
          Quiet: false,
        },
      };
      s3.deleteObjects(params1, function (err, data) {
        if (err) {
          // console.log(err, err.stack);
          res(false);
        }
        // an error occurred
        else res(true); // successful response
      });
    });
  });
};

// deleteAllFiles("media/Banner/60be6ba722d66824206124cc/");
// deleteAllfiles("video/banner/");
// upload("video/banner/1/", "0rv2tD0Rf3.pdf");
// deleteFile("video/banner/1/0rv2tD0Rf3.pdf");

// multiFileStore(
//   "Banner",
//   [{ image: "image.jpg" }],
//   "60be6ba722d66824206124cc",
//   true
// );

// deleteFileUpdateInDb("60be72704b34322990f6b720");

//////////////////////////////////////////////////////////////////

module.exports = {
  getAllAttachments,
  tempFileStore,
  deleteAttachments,
  storingFiles,
  multiFileStore,
  getAttachmentDetails,
  isfileExist,
  b64ToImage,
  deleteFiles,
  router,
};
