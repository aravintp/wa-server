
import fs from 'fs/promises';

const files = await fs.readdir(".wwebjs_auth", {
      recursive: true,
      withFileTypes: true,
    });
    for (const file of files) {
      if (file.name.toLowerCase().startsWith("singleton")) {
        const filePath = path.join(file.parentPath, file.name);
        await fs.unlink(filePath);
      }
    }

