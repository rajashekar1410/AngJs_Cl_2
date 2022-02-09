import { TreeNode } from '@circlon/angular-tree-component';

interface TOCIndexArrangeModel {
  id: number,
  children?: TOCIndexArrangeModel[]
}

export class TOCIndexArrange {

  public static fixUp(rootNodes: TreeNode[]) {
    return rootNodes.map(n => {
      return <TOCIndexArrangeModel>{
        id: n.id,
        children: this.fixUp(n.hasChildren ? n.children : [])
      };
    })
  }

}