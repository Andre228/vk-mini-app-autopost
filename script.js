const APP_ID = 53531205; // ← вставь сюда ID приложения
const GROUP_ID = 130584395; // ← без минуса
let accessToken = '';
let files = [];

document.getElementById('get-token').addEventListener('click', async () => {
  console.log('Авторизация...');
  await vkBridge.send('VKWebAppInit');
  const result = await vkBridge.send('VKWebAppGetAuthToken', {
    app_id: APP_ID,
    scope: 'photos,wall,groups,offline'
  });
  accessToken = result.access_token;
  document.getElementById('status').textContent = 'Авторизация успешна';
});

document.getElementById('file-input').addEventListener('change', (e) => {
  files = Array.from(e.target.files);
});

document.getElementById('upload-button').addEventListener('click', async () => {
  if (!accessToken) {
    alert('Сначала нажми "Войти"');
    return;
  }

  let delay = 0;
  for (const file of files) {
    try {
      // 1. Получаем upload URL
      const uploadUrlRes = await fetch(`https://api.vk.com/method/photos.getWallUploadServer?access_token=${accessToken}&v=5.131&group_id=${GROUP_ID}`);
      const uploadUrl = (await uploadUrlRes.json()).response.upload_url;

      // 2. Загружаем изображение
      const formData = new FormData();
      formData.append('photo', file);
      const uploaded = await fetch(uploadUrl, { method: 'POST', body: formData });
      const uploadData = await uploaded.json();

      // 3. Сохраняем фото
      const savePhotoRes = await fetch(`https://api.vk.com/method/photos.saveWallPhoto?access_token=${accessToken}&v=5.131&group_id=${GROUP_ID}&photo=${uploadData.photo}&server=${uploadData.server}&hash=${uploadData.hash}`);
      const saved = (await savePhotoRes.json()).response[0];
      const attachment = `photo${saved.owner_id}_${saved.id}`;

      // 4. Планируем пост
      const publishTime = Math.floor(Date.now() / 1000) + delay;
      await fetch(`https://api.vk.com/method/wall.post?access_token=${accessToken}&v=5.131&owner_id=-${GROUP_ID}&from_group=1&attachments=${attachment}&publish_date=${publishTime}`);

      delay += 2 * 3600; // +2 часа
    } catch (err) {
      console.error('Ошибка:', err);
      document.getElementById('status').textContent = 'Ошибка при публикации';
      return;
    }
  }

  document.getElementById('status').textContent = 'Посты успешно запланированы';
});
