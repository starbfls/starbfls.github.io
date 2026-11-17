// 建筑参数和房间内容集中在这里，便于替换个人内容。
export const TAU = Math.PI * 2;
export const FLOOR_HEIGHT = 4.8;
export const STAIR_START_ANGLE = 0.65;
export const ROOM_DEFINITIONS = [
  {
    name: '栖木书房',
    english: 'THE STUDY',
    angle: -2.2,
    color: '#896347',
    description: '木头、书页和暖光。留一把椅子，给那些想慢慢说的话。',
    theme: 'study',
  },
  {
    name: '留光展厅',
    english: 'THE GALLERY',
    angle: 2.55,
    color: '#d2c5a6',
    description: '把走过的地方，和偶然遇见的光，安静地挂在墙上。',
    theme: 'gallery',
  },
  {
    name: '深夜实验室',
    english: 'THE LAB',
    angle: -2.8,
    color: '#4a5664',
    description: '灯还亮着。这里装着小作品、实验，以及尚未完成的念头。',
    theme: 'lab',
  },
];
