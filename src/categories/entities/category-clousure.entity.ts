import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import { Category } from './category.entity';

@Entity('category_closures')
// 🌟 ÍNDICE CLAVE: Asegura la unicidad y optimiza el acceso.
@Index(['ancestorId', 'descendantId'], { unique: true }) 
export class CategoryClosure {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  // El ID del nodo superior en la jerarquía.
  ancestorId: string;

  @ManyToOne(() => Category, category => category.descendants, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'ancestorId' })
  ancestor: Category;

  @Column('uuid')
  // El ID del nodo inferior en la jerarquía.
  descendantId: string;

  @ManyToOne(() => Category, category => category.ancestors, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'descendantId' })
  descendant: Category;

  @Column({ default: 0 })
  // Distancia o número de niveles entre el ancestro y el descendiente.
  depth: number; 
}