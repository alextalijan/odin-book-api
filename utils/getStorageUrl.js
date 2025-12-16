function getStorageUrl(imgType, id) {
  const availableTypes = ['avatar', 'post'];

  if (!availableTypes.includes(imgType)) {
    throw new Error('Type does not exist.');
  }

  return `https://odin-book-storage.s3.us-east-1.amazonaws.com/${imgType}s/${id}.jpg`;
}

module.exports = getStorageUrl;
