import { ActiveFilter } from '../../../modules/system/enums/filter/active-filter/active-filter.enum';
import { ActiveMessage } from '../../../modules/system/enums/messages/active-messages/active-messages.enum';

export class TestDtoActiveFilter {
  constructor(private readonly defaultDTOData: object) {}

  get acceptData() {
    const data = [
      {
        description: `should pass validation and return "${ActiveFilter.ACTIVE}" when active = null`,
        data: { active: null },
        expectedResult: { ...this.defaultDTOData, active: ActiveFilter.ACTIVE },
      },
      {
        description: `should pass validation and return "${ActiveFilter.ACTIVE}" when active = undefined`,
        data: { active: undefined },
        expectedResult: { ...this.defaultDTOData, active: ActiveFilter.ACTIVE },
      },
      {
        description: `should pass validation and return "${ActiveFilter.ACTIVE}" when active = "active"`,
        data: { active: 'active' },
        expectedResult: { ...this.defaultDTOData, active: ActiveFilter.ACTIVE },
      },
      {
        description: `should pass validation and return "${ActiveFilter.INACTIVE}" when active = "inactive"`,
        data: { active: 'inactive' },
        expectedResult: {
          ...this.defaultDTOData,
          active: ActiveFilter.INACTIVE,
        },
      },
      {
        description: `should pass validation and return "${ActiveFilter.ALL}" when active = "all"`,
        data: { active: 'all' },
        expectedResult: { ...this.defaultDTOData, active: ActiveFilter.ALL },
      },
    ];
    return data;
  }

  get errorData() {
    const data = [
      {
        description: 'active is invalid string',
        data: { active: 'aCtivE' },
        constraints: { isEnum: ActiveMessage.INVALID },
      },
      {
        description: 'active = ""',
        data: { active: '' },
        constraints: { isEnum: ActiveMessage.INVALID },
      },
      {
        description: 'active is boolean',
        data: { active: true },
        constraints: { isEnum: ActiveMessage.INVALID },
      },
      {
        description: 'active is boolean string',
        data: { active: 'true' },
        constraints: { isEnum: ActiveMessage.INVALID },
      },
      {
        description: 'active is number',
        data: { active: 4334556 },
        constraints: { isEnum: ActiveMessage.INVALID },
      },
      {
        description: 'active is object',
        data: { active: {} },
        constraints: { isEnum: ActiveMessage.INVALID },
      },
      {
        description: 'active is array',
        data: { active: [] },
        constraints: { isEnum: ActiveMessage.INVALID },
      },
    ];
    return data;
  }
}
